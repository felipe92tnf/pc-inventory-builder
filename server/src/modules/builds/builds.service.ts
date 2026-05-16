import { BuildStatus, InventoryKind, PartCategory, Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { customerDataForEntity } from "../customers/customers.resolve.js";
import {
  addBuildExtraLineSchema,
  addBuildManualLineSchema,
  addBuildItemSchema,
  confirmBuildSchema,
  createBuildSchema,
  fromPrebuiltPartSchema,
  updateBuildExtraLineSchema,
  updateBuildItemSchema,
  updateBuildSchema
} from "./builds.validators.js";

function categorySkipsStock(category: PartCategory): boolean {
  return category === PartCategory.OS || category === PartCategory.LABOR;
}

/** OS/LABOR no descuentan stock; PCs premontados si (unidades fisicas). */
function partSkipsStockDeduction(part: { category: PartCategory | null; inventoryKind: InventoryKind }): boolean {
  if (part.inventoryKind === InventoryKind.PREBUILT_PC) return false;
  if (part.category === null) return false;
  return categorySkipsStock(part.category);
}

function moneyDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(Math.round(value * 100) / 100);
}

type BuildItemForPricing = {
  quantity: number;
  unitCost: unknown;
  unitSalePrice: unknown;
};

function totalsFromItems(items: BuildItemForPricing[]) {
  const totalCost = items.reduce((sum, item) => sum + Number(item.unitCost) * item.quantity, 0);
  const computedSaleTotal = items.reduce((sum, item) => sum + Number(item.unitSalePrice) * item.quantity, 0);
  return { totalCost, computedSaleTotal };
}

export function finalizePricing(
  items: BuildItemForPricing[],
  saleTotalOverride: unknown,
  extraLines: BuildItemForPricing[] = []
) {
  const partTotals = totalsFromItems(items);
  const extraTotals = totalsFromItems(extraLines);
  const totalCost = partTotals.totalCost + extraTotals.totalCost;
  const computedSaleTotal = partTotals.computedSaleTotal + extraTotals.computedSaleTotal;
  const totalSale =
    saleTotalOverride !== undefined && saleTotalOverride !== null ? Number(saleTotalOverride) : computedSaleTotal;
  const profit = totalSale - totalCost;
  return { totalCost, computedSaleTotal, totalSale, profit };
}

export async function listBuilds() {
  const builds = await prisma.build.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { include: { part: true } }, extraLines: { include: { extraTemplate: true } } }
  });

  return builds.map((build) => {
    const items = build.items ?? [];
    const extraLines = build.extraLines ?? [];
    const pricing = finalizePricing(items, build.saleTotalOverride, extraLines);
    return {
      ...build,
      items,
      extraLines,
      ...pricing
    };
  });
}

export async function getBuild(id: string) {
  const build = await prisma.build.findUnique({
    where: { id },
    include: { items: { include: { part: true } }, extraLines: { include: { extraTemplate: true } } }
  });

  if (!build) {
    return null;
  }

  const items = build.items ?? [];
  const extraLines = build.extraLines ?? [];
  const pricing = finalizePricing(items, build.saleTotalOverride, extraLines);

  return {
    ...build,
    items,
    extraLines,
    ...pricing
  };
}

export async function createBuild(payload: unknown) {
  const data = createBuildSchema.parse(payload);
  const customer =
    data.customerName != null && data.customerName !== ""
      ? await customerDataForEntity({
          customerId: data.customerId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail
        })
      : null;

  return prisma.build.create({
    data: {
      name: data.name.trim(),
      notes: data.notes ?? null,
      customerId: customer?.customerId ?? null,
      customerName: customer?.customerName || null,
      customerPhone: customer?.customerPhone ?? null,
      customerEmail: customer?.customerEmail ?? null
    }
  });
}

/**
 * Crea un montaje con una sola linea (el PC premontado), lo confirma y descuenta 1 unidad del inventario.
 * Listo para registrar la venta igual que un montaje por piezas ya ensamblado.
 */
export async function createBuildFromPrebuiltPart(payload: unknown) {
  const data = fromPrebuiltPartSchema.parse(payload);

  const part = await prisma.part.findUnique({ where: { id: data.partId } });
  if (!part) {
    throw new Error("PART_NOT_FOUND");
  }
  if (part.inventoryKind !== InventoryKind.PREBUILT_PC) {
    throw new Error("INVALID_PREBUILT_PART");
  }
  if (part.stock < 1) {
    throw new Error(`INSUFFICIENT_STOCK:${part.name}`);
  }

  const notesParts = [part.description?.trim(), part.notes?.trim()].filter((t): t is string => Boolean(t && t.length > 0));
  const combinedNotes = notesParts.length > 0 ? notesParts.join("\n\n") : null;

  const build = await prisma.build.create({
    data: {
      name: part.name,
      notes: combinedNotes,
      status: BuildStatus.DRAFT
    }
  });

  await prisma.buildPartItem.create({
    data: {
      buildId: build.id,
      partId: part.id,
      quantity: 1,
      unitCost: part.costPrice,
      unitSalePrice: part.salePrice
    }
  });

  return confirmBuild(build.id);
}

const ASSEMBLED_LIKE: Set<BuildStatus> = new Set([
  BuildStatus.CONFIRMED,
  BuildStatus.PENDING_PICKUP,
  BuildStatus.PENDING_PAYMENT,
  BuildStatus.RESERVED
]);

export async function updateBuild(id: string, payload: unknown) {
  const data = updateBuildSchema.parse(payload);

  const existing = await prisma.build.findUnique({ where: { id }, include: { sale: true } });
  if (!existing) {
    throw new Error("BUILD_NOT_FOUND");
  }
  if (existing.status === BuildStatus.SOLD) {
    throw new Error("BUILD_IS_SOLD");
  }

  const patch: Prisma.BuildUpdateInput = {};
  if (data.name !== undefined) patch.name = data.name.trim();
  if (data.notes !== undefined) patch.notes = data.notes ?? null;
  if (
    data.customerId !== undefined ||
    data.customerName !== undefined ||
    data.customerPhone !== undefined ||
    data.customerEmail !== undefined
  ) {
    const nextName =
      data.customerName !== undefined ? data.customerName : existing.customerName;
    if (nextName === null || nextName === "") {
      patch.customer = { disconnect: true };
      patch.customerName = null;
      patch.customerPhone = null;
      patch.customerEmail = null;
    } else {
      const customer = await customerDataForEntity({
        customerId: data.customerId ?? existing.customerId,
        customerName: nextName,
        customerPhone:
          data.customerPhone !== undefined ? data.customerPhone : existing.customerPhone,
        customerEmail:
          data.customerEmail !== undefined ? data.customerEmail : existing.customerEmail
      });
      if (customer.customerId) {
        patch.customer = { connect: { id: customer.customerId } };
      }
      patch.customerName = customer.customerName;
      patch.customerPhone = customer.customerPhone;
      patch.customerEmail = customer.customerEmail;
    }
  }
  if (data.saleTotalOverride !== undefined) {
    patch.saleTotalOverride =
      data.saleTotalOverride === null ? null : moneyDecimal(data.saleTotalOverride);
  }

  if (data.status !== undefined) {
    const next = data.status;
    if (next === BuildStatus.DRAFT || next === BuildStatus.SOLD) {
      throw new Error("BUILD_STATUS_PATCH_FORBIDDEN");
    }
    if (existing.status === BuildStatus.DRAFT) {
      throw new Error("BUILD_STATUS_USE_CONFIRM");
    }
    if (!ASSEMBLED_LIKE.has(existing.status)) {
      throw new Error("BUILD_STATUS_INVALID");
    }
    if (next === BuildStatus.PENDING_PICKUP) {
      const s = existing.sale;
      if (!s) {
        throw new Error("BUILD_PENDING_PICKUP_NEEDS_SALE");
      }
      if (s.pickupConfirmedAt != null) {
        throw new Error("BUILD_ALREADY_DELIVERED");
      }
    }
    if (ASSEMBLED_LIKE.has(next) && next !== BuildStatus.PENDING_PICKUP) {
      const s = existing.sale;
      if (s && s.pickupConfirmedAt == null) {
        throw new Error("BUILD_HAS_PENDING_PICKUP_SALE");
      }
    }
    if (next === BuildStatus.RESERVED) {
      patch.pendingPaymentPaid = null;
      patch.pendingPaymentRemaining = null;
    }
    if (next === BuildStatus.PENDING_PAYMENT) {
      patch.reservationDeposit = null;
      patch.reservationRemaining = null;
    }
    if (next === BuildStatus.CONFIRMED || next === BuildStatus.PENDING_PICKUP) {
      patch.reservationDeposit = null;
      patch.reservationRemaining = null;
      patch.pendingPaymentPaid = null;
      patch.pendingPaymentRemaining = null;
      patch.partialAccruedAt = null;
    }
    patch.status = next;
  }

  let touchPartialAccrual = false;
  if (data.reservationDeposit !== undefined) {
    patch.reservationDeposit =
      data.reservationDeposit === null ? null : moneyDecimal(data.reservationDeposit);
    touchPartialAccrual = true;
  }
  if (data.reservationRemaining !== undefined) {
    patch.reservationRemaining =
      data.reservationRemaining === null ? null : moneyDecimal(data.reservationRemaining);
    touchPartialAccrual = true;
  }
  if (data.pendingPaymentPaid !== undefined) {
    patch.pendingPaymentPaid =
      data.pendingPaymentPaid === null ? null : moneyDecimal(data.pendingPaymentPaid);
    touchPartialAccrual = true;
  }
  if (data.pendingPaymentRemaining !== undefined) {
    patch.pendingPaymentRemaining =
      data.pendingPaymentRemaining === null ? null : moneyDecimal(data.pendingPaymentRemaining);
    touchPartialAccrual = true;
  }

  const effectiveStatus = (data.status as BuildStatus | undefined) ?? existing.status;
  if (
    touchPartialAccrual &&
    (effectiveStatus === BuildStatus.RESERVED || effectiveStatus === BuildStatus.PENDING_PAYMENT)
  ) {
    patch.partialAccruedAt = new Date();
  }

  if (Object.keys(patch).length === 0) {
    return getBuild(id);
  }

  await prisma.build.update({ where: { id }, data: patch });
  return getBuild(id);
}

export async function deleteBuild(id: string) {
  const existing = await prisma.build.findUnique({ where: { id }, include: { sale: true } });
  if (!existing) {
    throw new Error("BUILD_NOT_FOUND");
  }
  if (existing.sale) {
    throw new Error("BUILD_HAS_SALE");
  }

  return prisma.build.delete({ where: { id } });
}

export async function addBuildItem(buildId: string, payload: unknown) {
  const data = addBuildItemSchema.parse(payload);

  const build = await prisma.build.findUnique({ where: { id: buildId } });
  if (!build) {
    throw new Error("BUILD_NOT_FOUND");
  }
  if (build.status !== BuildStatus.DRAFT) {
    throw new Error("BUILD_NOT_EDITABLE");
  }

  const part = await prisma.part.findUnique({ where: { id: data.partId } });
  if (!part) {
    throw new Error("PART_NOT_FOUND");
  }
  if (part.inventoryKind !== InventoryKind.PART) {
    throw new Error("BUILD_ITEM_REQUIRES_PART_KIND");
  }

  const unitCost = part.costPrice;
  const unitSalePrice =
    data.unitSalePrice !== undefined && data.unitSalePrice !== null
      ? moneyDecimal(data.unitSalePrice)
      : part.salePrice;

  const existing = await prisma.buildPartItem.findUnique({
    where: { buildId_partId: { buildId, partId: data.partId } }
  });

  if (existing) {
    return prisma.buildPartItem.update({
      where: { id: existing.id },
      data: {
        quantity: existing.quantity + data.quantity,
        ...(data.unitSalePrice !== undefined && data.unitSalePrice !== null
          ? { unitSalePrice: moneyDecimal(data.unitSalePrice) }
          : {})
      }
    });
  }

  return prisma.buildPartItem.create({
    data: {
      buildId,
      partId: data.partId,
      quantity: data.quantity,
      unitCost,
      unitSalePrice
    }
  });
}

export async function updateBuildItem(buildId: string, itemId: string, payload: unknown) {
  const data = updateBuildItemSchema.parse(payload);

  const build = await prisma.build.findUnique({ where: { id: buildId } });
  if (!build) {
    throw new Error("BUILD_NOT_FOUND");
  }
  if (build.status !== BuildStatus.DRAFT) {
    throw new Error("BUILD_NOT_EDITABLE");
  }

  const patch: { quantity?: number; unitSalePrice?: Prisma.Decimal } = {};
  if (data.quantity !== undefined) {
    patch.quantity = data.quantity;
  }
  if (data.unitSalePrice !== undefined && data.unitSalePrice !== null) {
    patch.unitSalePrice = moneyDecimal(data.unitSalePrice);
  }

  return prisma.buildPartItem.update({
    where: { id: itemId, buildId },
    data: patch
  });
}

export async function deleteBuildItem(buildId: string, itemId: string) {
  const build = await prisma.build.findUnique({ where: { id: buildId } });
  if (!build) {
    throw new Error("BUILD_NOT_FOUND");
  }
  if (build.status !== BuildStatus.DRAFT) {
    throw new Error("BUILD_NOT_EDITABLE");
  }

  return prisma.buildPartItem.delete({ where: { id: itemId } });
}

export async function addBuildManualLine(buildId: string, payload: unknown) {
  const data = addBuildManualLineSchema.parse(payload);

  const build = await prisma.build.findUnique({ where: { id: buildId } });
  if (!build) {
    throw new Error("BUILD_NOT_FOUND");
  }
  if (build.status !== BuildStatus.DRAFT) {
    throw new Error("BUILD_NOT_EDITABLE");
  }

  return prisma.buildExtraLine.create({
    data: {
      buildId,
      extraTemplateId: null,
      name: data.name.trim(),
      description: data.description ?? "",
      quantity: data.quantity ?? 1,
      unitCost: moneyDecimal(data.unitCost),
      unitSalePrice: moneyDecimal(data.unitSalePrice)
    }
  });
}

export async function addBuildExtraLine(buildId: string, payload: unknown) {
  const data = addBuildExtraLineSchema.parse(payload);

  const build = await prisma.build.findUnique({ where: { id: buildId } });
  if (!build) {
    throw new Error("BUILD_NOT_FOUND");
  }
  if (build.status !== BuildStatus.DRAFT) {
    throw new Error("BUILD_NOT_EDITABLE");
  }

  const template = await prisma.extraTemplate.findUnique({ where: { id: data.extraTemplateId } });
  if (!template) {
    throw new Error("EXTRA_TEMPLATE_NOT_FOUND");
  }
  if (!template.active) {
    throw new Error("EXTRA_TEMPLATE_INACTIVE");
  }

  const qty = data.quantity ?? 1;
  const unitCost =
    data.unitCost !== undefined && data.unitCost !== null
      ? moneyDecimal(data.unitCost)
      : template.defaultCostPrice;
  const unitSalePrice =
    data.unitSalePrice !== undefined && data.unitSalePrice !== null
      ? moneyDecimal(data.unitSalePrice)
      : template.defaultSalePrice;

  return prisma.buildExtraLine.create({
    data: {
      buildId,
      extraTemplateId: template.id,
      name: template.name,
      description: template.description ?? "",
      quantity: qty,
      unitCost,
      unitSalePrice
    }
  });
}

export async function updateBuildExtraLine(buildId: string, lineId: string, payload: unknown) {
  const data = updateBuildExtraLineSchema.parse(payload);

  const build = await prisma.build.findUnique({ where: { id: buildId } });
  if (!build) {
    throw new Error("BUILD_NOT_FOUND");
  }
  if (build.status !== BuildStatus.DRAFT) {
    throw new Error("BUILD_NOT_EDITABLE");
  }

  const existing = await prisma.buildExtraLine.findFirst({
    where: { id: lineId, buildId }
  });
  if (!existing) {
    throw new Error("BUILD_EXTRA_LINE_NOT_FOUND");
  }

  const patch: { quantity?: number; unitCost?: Prisma.Decimal; unitSalePrice?: Prisma.Decimal } = {};
  if (data.quantity !== undefined) patch.quantity = data.quantity;
  if (data.unitCost !== undefined) patch.unitCost = moneyDecimal(data.unitCost);
  if (data.unitSalePrice !== undefined) patch.unitSalePrice = moneyDecimal(data.unitSalePrice);

  return prisma.buildExtraLine.update({
    where: { id: lineId },
    data: patch
  });
}

export async function deleteBuildExtraLine(buildId: string, lineId: string) {
  const build = await prisma.build.findUnique({ where: { id: buildId } });
  if (!build) {
    throw new Error("BUILD_NOT_FOUND");
  }
  if (build.status !== BuildStatus.DRAFT) {
    throw new Error("BUILD_NOT_EDITABLE");
  }

  const removed = await prisma.buildExtraLine.deleteMany({ where: { id: lineId, buildId } });
  if (removed.count === 0) {
    throw new Error("BUILD_EXTRA_LINE_NOT_FOUND");
  }
}

export async function confirmBuild(buildId: string, payload?: unknown) {
  const opts = confirmBuildSchema.parse(payload ?? {});
  const targetStatus = opts.initialStatus ?? BuildStatus.CONFIRMED;

  const build = await prisma.build.findUnique({
    where: { id: buildId },
    include: { items: { include: { part: true } }, extraLines: true }
  });

  if (!build) {
    throw new Error("BUILD_NOT_FOUND");
  }
  if (build.status !== BuildStatus.DRAFT) {
    throw new Error("BUILD_NOT_DRAFT");
  }
  if (build.items.length === 0 && build.extraLines.length === 0) {
    throw new Error("BUILD_EMPTY");
  }

  const insufficient = build.items.find(
    (item) => !partSkipsStockDeduction(item.part) && item.part.stock < item.quantity
  );
  if (insufficient) {
    throw new Error(`INSUFFICIENT_STOCK:${insufficient.part.name}`);
  }

  const statusPatch: Prisma.BuildUpdateInput = {
    status: targetStatus,
    confirmedAt: new Date()
  };

  if (targetStatus === BuildStatus.CONFIRMED) {
    statusPatch.reservationDeposit = null;
    statusPatch.reservationRemaining = null;
    statusPatch.pendingPaymentPaid = null;
    statusPatch.pendingPaymentRemaining = null;
    statusPatch.partialAccruedAt = null;
  } else if (targetStatus === BuildStatus.RESERVED) {
    statusPatch.pendingPaymentPaid = null;
    statusPatch.pendingPaymentRemaining = null;
    statusPatch.reservationDeposit = moneyDecimal(opts.reservationDeposit!);
    statusPatch.reservationRemaining = moneyDecimal(opts.reservationRemaining!);
    statusPatch.partialAccruedAt = new Date();
  } else if (targetStatus === BuildStatus.PENDING_PAYMENT) {
    statusPatch.reservationDeposit = null;
    statusPatch.reservationRemaining = null;
    statusPatch.pendingPaymentPaid = moneyDecimal(opts.pendingPaymentPaid!);
    statusPatch.pendingPaymentRemaining = moneyDecimal(opts.pendingPaymentRemaining!);
    statusPatch.partialAccruedAt = new Date();
  }

  await prisma.$transaction(async (tx) => {
    for (const item of build.items) {
      if (partSkipsStockDeduction(item.part)) {
        continue;
      }
      await tx.part.update({
        where: { id: item.partId },
        data: { stock: { decrement: item.quantity } }
      });
    }

    await tx.build.update({
      where: { id: buildId },
      data: statusPatch
    });
  });

  return getBuild(buildId);
}

export async function revertBuildToDraft(buildId: string) {
  const build = await prisma.build.findUnique({
    where: { id: buildId },
    include: { items: true, sale: true }
  });

  if (!build) {
    throw new Error("BUILD_NOT_FOUND");
  }
  if (build.status === BuildStatus.SOLD) {
    throw new Error("BUILD_IS_SOLD");
  }
  if (build.sale) {
    throw new Error("BUILD_HAS_SALE");
  }
  if (!ASSEMBLED_LIKE.has(build.status)) {
    throw new Error("BUILD_NOT_CONFIRMED");
  }

  await prisma.$transaction(async (tx) => {
    const itemsWithParts = await tx.buildPartItem.findMany({
      where: { buildId },
      include: { part: true }
    });

    for (const item of itemsWithParts) {
      if (partSkipsStockDeduction(item.part)) {
        continue;
      }
      await tx.part.update({
        where: { id: item.partId },
        data: { stock: { increment: item.quantity } }
      });
    }

    await tx.build.update({
      where: { id: buildId },
      data: {
        status: BuildStatus.DRAFT,
        confirmedAt: null,
        reservationDeposit: null,
        reservationRemaining: null,
        pendingPaymentPaid: null,
        pendingPaymentRemaining: null,
        partialAccruedAt: null
      }
    });
  });

  return getBuild(buildId);
}
