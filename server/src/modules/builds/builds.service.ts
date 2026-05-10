import { BuildStatus, InventoryKind, PartCategory, Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import {
  addBuildItemSchema,
  createBuildSchema,
  fromPrebuiltPartSchema,
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
  saleTotalOverride: unknown
) {
  const { totalCost, computedSaleTotal } = totalsFromItems(items);
  const totalSale =
    saleTotalOverride !== undefined && saleTotalOverride !== null ? Number(saleTotalOverride) : computedSaleTotal;
  const profit = totalSale - totalCost;
  return { totalCost, computedSaleTotal, totalSale, profit };
}

export async function listBuilds() {
  const builds = await prisma.build.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { include: { part: true } } }
  });

  return builds.map((build) => {
    const items = build.items ?? [];
    const pricing = finalizePricing(items, build.saleTotalOverride);
    return {
      ...build,
      items,
      ...pricing
    };
  });
}

export async function getBuild(id: string) {
  const build = await prisma.build.findUnique({
    where: { id },
    include: { items: { include: { part: true } } }
  });

  if (!build) {
    return null;
  }

  const items = build.items ?? [];

  if (items.length === 0) {
    const pricing = finalizePricing(items, build.saleTotalOverride);
    return {
      ...build,
      items,
      ...pricing
    };
  }

  const pricing = finalizePricing(items, build.saleTotalOverride);

  return {
    ...build,
    items,
    ...pricing
  };
}

export async function createBuild(payload: unknown) {
  const data = createBuildSchema.parse(payload);
  return prisma.build.create({ data });
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

export async function updateBuild(id: string, payload: unknown) {
  const data = updateBuildSchema.parse(payload);

  const existing = await prisma.build.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("BUILD_NOT_FOUND");
  }
  if (existing.status === BuildStatus.SOLD) {
    throw new Error("BUILD_IS_SOLD");
  }

  return prisma.build.update({ where: { id }, data });
}

export async function deleteBuild(id: string) {
  const existing = await prisma.build.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("BUILD_NOT_FOUND");
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

export async function confirmBuild(buildId: string) {
  const build = await prisma.build.findUnique({
    where: { id: buildId },
    include: { items: { include: { part: true } } }
  });

  if (!build) {
    throw new Error("BUILD_NOT_FOUND");
  }
  if (build.status !== BuildStatus.DRAFT) {
    throw new Error("BUILD_NOT_DRAFT");
  }
  if (build.items.length === 0) {
    throw new Error("BUILD_EMPTY");
  }

  const insufficient = build.items.find(
    (item) => !partSkipsStockDeduction(item.part) && item.part.stock < item.quantity
  );
  if (insufficient) {
    throw new Error(`INSUFFICIENT_STOCK:${insufficient.part.name}`);
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
      data: { status: BuildStatus.CONFIRMED, confirmedAt: new Date() }
    });
  });

  return getBuild(buildId);
}

export async function revertBuildToDraft(buildId: string) {
  const build = await prisma.build.findUnique({
    where: { id: buildId },
    include: { items: true }
  });

  if (!build) {
    throw new Error("BUILD_NOT_FOUND");
  }
  if (build.status === BuildStatus.SOLD) {
    throw new Error("BUILD_IS_SOLD");
  }
  if (build.status !== BuildStatus.CONFIRMED) {
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
      data: { status: BuildStatus.DRAFT, confirmedAt: null }
    });
  });

  return getBuild(buildId);
}
