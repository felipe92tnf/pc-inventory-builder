import { randomUUID } from "node:crypto";
import { InventoryKind, Prisma, ServiceStatus, ServiceType } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { customerDataForEntity } from "../customers/customers.resolve.js";
import {
  addServiceExtraLineBodySchema,
  createServiceSchema,
  listServicesQuerySchema,
  mergeSparePartLines,
  patchServiceExtraLineSchema,
  patchServiceSchema
} from "./services.validators.js";

const serviceInclude = {
  selectedPart: true,
  sparePartLines: { include: { part: true } },
  extraLines: { include: { extraTemplate: true } }
} as const;

function moneyDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(Math.round(value * 100) / 100);
}

function normEmail(value: string | null | undefined): string | null {
  if (value === undefined || value === null || value.trim() === "") {
    return null;
  }
  return value.trim();
}

function normNotes(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const t = value.trim();
  return t === "" ? null : t;
}

type SpareLine = { partId: string; quantity: number };

async function validateSpareLinesStock(lines: SpareLine[]): Promise<void> {
  const parts = await prisma.part.findMany({
    where: { id: { in: lines.map((l) => l.partId) } }
  });
  const byId = new Map(parts.map((p) => [p.id, p]));
  for (const line of lines) {
    const part = byId.get(line.partId);
    if (!part) {
      throw new Error("PART_NOT_FOUND");
    }
    if (part.inventoryKind !== InventoryKind.PART) {
      throw new Error("SPARE_PART_REQUIRES_PART_KIND");
    }
    if (part.stock < line.quantity) {
      throw new Error("INSUFFICIENT_STOCK");
    }
  }
}

function spareCostTotal(lines: SpareLine[], parts: { id: string; costPrice: Prisma.Decimal }[]): number {
  const byId = new Map(parts.map((p) => [p.id, Number(p.costPrice)]));
  let total = 0;
  for (const line of lines) {
    const unit = byId.get(line.partId);
    if (unit === undefined) {
      throw new Error("PART_NOT_FOUND");
    }
    total += unit * line.quantity;
  }
  return total;
}

function sumServiceExtraLinesCost(
  lines: { unitCost: Prisma.Decimal | unknown; quantity: number }[]
): number {
  return lines.reduce((sum, row) => sum + Number(row.unitCost) * row.quantity, 0);
}

function resolveCreateSpareLines(data: {
  sparePartLines?: SpareLine[] | undefined;
  selectedPartId?: string | null;
  quantity?: number | null;
}): SpareLine[] {
  const merged = mergeSparePartLines(data.sparePartLines ?? []);
  if (merged.length > 0) {
    return merged;
  }
  if (data.selectedPartId && data.quantity !== undefined && data.quantity !== null && data.quantity >= 1) {
    return [{ partId: data.selectedPartId, quantity: data.quantity }];
  }
  return [];
}

type ExtraSnapshot = {
  extraTemplateId: string;
  name: string;
  description: string;
  quantity: number;
  unitCost: number;
  unitSalePrice: number;
};

type ManualSnapshot = {
  name: string;
  description: string;
  quantity: number;
  unitCost: number;
  unitSalePrice: number;
};

function resolveManualLineSnapshots(
  lines:
    | {
        name: string;
        description?: string;
        quantity?: number;
        unitCost?: number;
        unitSalePrice: number;
      }[]
    | undefined
): { snapshots: ManualSnapshot[]; sumCost: number; sumSale: number } {
  if (!lines || lines.length === 0) {
    return { snapshots: [], sumCost: 0, sumSale: 0 };
  }
  const snapshots: ManualSnapshot[] = [];
  let sumCost = 0;
  let sumSale = 0;
  for (const line of lines) {
    const qty = line.quantity ?? 1;
    const uc = line.unitCost ?? 0;
    const us = line.unitSalePrice;
    sumCost += uc * qty;
    sumSale += us * qty;
    snapshots.push({
      name: line.name.trim(),
      description: (line.description ?? "").trim(),
      quantity: qty,
      unitCost: uc,
      unitSalePrice: us
    });
  }
  return { snapshots, sumCost, sumSale };
}

async function persistServiceLineSnapshots(
  tx: Prisma.TransactionClient,
  serviceId: string,
  manual: ManualSnapshot[],
  template: ExtraSnapshot[]
) {
  if (manual.length > 0) {
    await tx.serviceExtraLine.createMany({
      data: manual.map((s) => ({
        serviceId,
        extraTemplateId: null,
        name: s.name,
        description: s.description,
        quantity: s.quantity,
        unitCost: moneyDecimal(s.unitCost),
        unitSalePrice: moneyDecimal(s.unitSalePrice)
      }))
    });
  }
  if (template.length > 0) {
    await tx.serviceExtraLine.createMany({
      data: template.map((s) => ({
        serviceId,
        extraTemplateId: s.extraTemplateId,
        name: s.name,
        description: s.description,
        quantity: s.quantity,
        unitCost: moneyDecimal(s.unitCost),
        unitSalePrice: moneyDecimal(s.unitSalePrice)
      }))
    });
  }
}

async function resolveExtraLineSnapshots(
  lines:
    | { extraTemplateId: string; quantity?: number; unitCost?: number; unitSalePrice?: number }[]
    | undefined
): Promise<{ snapshots: ExtraSnapshot[]; sumCost: number; sumSale: number }> {
  if (!lines || lines.length === 0) {
    return { snapshots: [], sumCost: 0, sumSale: 0 };
  }
  const snapshots: ExtraSnapshot[] = [];
  let sumCost = 0;
  let sumSale = 0;
  for (const line of lines) {
    const t = await prisma.extraTemplate.findUnique({ where: { id: line.extraTemplateId } });
    if (!t) {
      throw new Error("EXTRA_TEMPLATE_NOT_FOUND");
    }
    if (!t.active) {
      throw new Error("EXTRA_TEMPLATE_INACTIVE");
    }
    const qty = line.quantity ?? 1;
    const uc = line.unitCost !== undefined ? line.unitCost : Number(t.defaultCostPrice);
    const us = line.unitSalePrice !== undefined ? line.unitSalePrice : Number(t.defaultSalePrice);
    sumCost += uc * qty;
    sumSale += us * qty;
    snapshots.push({
      extraTemplateId: t.id,
      name: t.name,
      description: (t.description ?? "").trim(),
      quantity: qty,
      unitCost: uc,
      unitSalePrice: us
    });
  }
  return { snapshots, sumCost, sumSale };
}

export async function createService(payload: unknown) {
  const data = createServiceSchema.parse(payload);

  const customer = await customerDataForEntity({
    customerId: data.customerId,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail
  });
  const supplement = data.homeServiceSupplement ?? 0;
  const extra = await resolveExtraLineSnapshots(data.extraLines);
  const manual = resolveManualLineSnapshots(data.manualLines);
  const hasConceptLines = manual.snapshots.length > 0 || extra.snapshots.length > 0;

  if (data.type === ServiceType.SPARE_PART_SALE) {
    const lines = resolveCreateSpareLines(data);
    await validateSpareLinesStock(lines);

    const parts = await prisma.part.findMany({
      where: { id: { in: lines.map((l) => l.partId) } }
    });
    const costTotal = spareCostTotal(lines, parts) + manual.sumCost + extra.sumCost;
    const manualSale = data.salePrice!;
    const saleTotal = manualSale + supplement + manual.sumSale + extra.sumSale;
    const profit = saleTotal - costTotal;

    return prisma.$transaction(async (tx) => {
      const row = await tx.service.create({
        data: {
          type: data.type,
          title: data.title.trim(),
          customerId: customer.customerId,
          customerName: customer.customerName,
          customerPhone: customer.customerPhone ?? "",
          customerEmail: customer.customerEmail,
          description: data.description?.trim() ?? "",
          selectedPartId: lines.length === 1 ? lines[0].partId : null,
          quantity: lines.length === 1 ? lines[0].quantity : null,
          costPrice: moneyDecimal(costTotal),
          salePrice: moneyDecimal(saleTotal),
          profit: moneyDecimal(profit),
          isHomeService: data.isHomeService,
          homeServiceAddress:
            data.isHomeService && data.homeServiceAddress?.trim()
              ? data.homeServiceAddress.trim()
              : null,
          homeServiceSupplement: supplement > 0 ? moneyDecimal(supplement) : null,
          serviceDate: data.serviceDate,
          status: ServiceStatus.PENDING,
          paymentMethod: normNotes(data.paymentMethod),
          notes: normNotes(data.notes),
          sparePartLines: {
            create: lines.map((l) => ({
              partId: l.partId,
              quantity: l.quantity
            }))
          }
        }
      });
      await persistServiceLineSnapshots(tx, row.id, manual.snapshots, extra.snapshots);
      return tx.service.findUnique({
        where: { id: row.id },
        include: serviceInclude
      });
    });
  }

  const lineCost = manual.sumCost + extra.sumCost;
  const cost = data.costPrice !== undefined ? data.costPrice : lineCost;
  const lineSale = manual.sumSale + extra.sumSale;
  const saleTotal = hasConceptLines
    ? lineSale + supplement
    : (data.salePrice ?? 0) + supplement;
  const profit = saleTotal - cost;

  return prisma.$transaction(async (tx) => {
    const row = await tx.service.create({
      data: {
        type: data.type,
        title: data.title.trim(),
        customerId: customer.customerId,
        customerName: customer.customerName,
        customerPhone: customer.customerPhone ?? "",
        customerEmail: customer.customerEmail,
        description: data.description?.trim() ?? "",
        selectedPartId: null,
        quantity: null,
        costPrice: moneyDecimal(cost),
        salePrice: moneyDecimal(saleTotal),
        profit: moneyDecimal(profit),
        isHomeService: data.isHomeService,
        homeServiceAddress:
          data.isHomeService && data.homeServiceAddress?.trim() ? data.homeServiceAddress.trim() : null,
        homeServiceSupplement: supplement > 0 ? moneyDecimal(supplement) : null,
        serviceDate: data.serviceDate,
        status: ServiceStatus.PENDING,
        paymentMethod: normNotes(data.paymentMethod),
        notes: normNotes(data.notes)
      }
    });
    await persistServiceLineSnapshots(tx, row.id, manual.snapshots, extra.snapshots);
    return tx.service.findUnique({
      where: { id: row.id },
      include: serviceInclude
    });
  });
}

export async function listServices(query: Record<string, unknown>) {
  const q = listServicesQuerySchema.parse(query);
  const where: Prisma.ServiceWhereInput = {};

  if (q.type) {
    where.type = q.type;
  }
  if (q.status) {
    where.status = q.status;
  }
  if (q.month !== undefined && q.year !== undefined) {
    const start = new Date(q.year, q.month - 1, 1);
    const end = new Date(q.year, q.month, 0, 23, 59, 59, 999);
    where.serviceDate = { gte: start, lte: end };
  }

  return prisma.service.findMany({
    where,
    orderBy: { serviceDate: "desc" },
    include: serviceInclude
  });
}

export async function getService(id: string) {
  return prisma.service.findUnique({
    where: { id },
    include: serviceInclude
  });
}

async function effectiveSpareLinesForPatch(
  existing: {
    type: ServiceType;
    selectedPartId: string | null;
    quantity: number | null;
    sparePartLines: { partId: string; quantity: number }[];
  },
  data: ReturnType<typeof patchServiceSchema.parse>
): Promise<SpareLine[]> {
  if (data.sparePartLines !== undefined) {
    const merged = mergeSparePartLines(data.sparePartLines);
    if (merged.length === 0) {
      throw new Error("SPARE_PART_INVALID");
    }
    return merged;
  }

  const rows = existing.sparePartLines?.map((r) => ({ partId: r.partId, quantity: r.quantity })) ?? [];
  if (rows.length > 0) {
    return rows;
  }

  const pid = data.selectedPartId !== undefined ? data.selectedPartId : existing.selectedPartId;
  const qty = data.quantity !== undefined ? data.quantity : existing.quantity;
  if (pid && qty !== undefined && qty !== null && qty >= 1) {
    return [{ partId: pid, quantity: qty }];
  }

  throw new Error("SPARE_PART_INVALID");
}

export async function patchService(id: string, payload: unknown) {
  const data = patchServiceSchema.parse(payload);

  const existing = await prisma.service.findUnique({
    where: { id },
    include: serviceInclude
  });
  if (!existing) {
    throw new Error("SERVICE_NOT_FOUND");
  }

  const isCompleted = existing.status === ServiceStatus.COMPLETED;
  if (isCompleted) {
    if (data.status !== undefined && data.status !== ServiceStatus.COMPLETED) {
      throw new Error("SERVICE_COMPLETED_STATUS_LOCKED");
    }
    if (data.type !== undefined && data.type !== existing.type) {
      throw new Error("SERVICE_COMPLETED_TYPE_LOCKED");
    }
    if (data.sparePartLines !== undefined) {
      throw new Error("SERVICE_COMPLETED_LINES_LOCKED");
    }
    if (data.selectedPartId !== undefined) {
      throw new Error("SERVICE_COMPLETED_LINES_LOCKED");
    }
    if (data.quantity !== undefined) {
      throw new Error("SERVICE_COMPLETED_LINES_LOCKED");
    }
  }

  const patch: Prisma.ServiceUncheckedUpdateInput = {};

  if (data.type !== undefined) patch.type = data.type;
  if (data.title !== undefined) patch.title = data.title.trim();
  if (
    data.customerId !== undefined ||
    data.customerName !== undefined ||
    data.customerPhone !== undefined ||
    data.customerEmail !== undefined
  ) {
    const customer = await customerDataForEntity({
      customerId: data.customerId ?? existing.customerId,
      customerName: data.customerName ?? existing.customerName,
      customerPhone: data.customerPhone ?? existing.customerPhone,
      customerEmail:
        data.customerEmail !== undefined ? normEmail(data.customerEmail) : existing.customerEmail
    });
    if (customer.customerId) {
      patch.customerId = customer.customerId;
    }
    patch.customerName = customer.customerName;
    patch.customerPhone = customer.customerPhone ?? "";
    patch.customerEmail = customer.customerEmail;
  }
  if (data.description !== undefined) patch.description = data.description.trim();
  if (data.isHomeService !== undefined) patch.isHomeService = data.isHomeService;
  if (data.homeServiceAddress !== undefined) {
    patch.homeServiceAddress =
      data.homeServiceAddress === null || data.homeServiceAddress.trim() === ""
        ? null
        : data.homeServiceAddress.trim();
  }
  if (data.serviceDate !== undefined) patch.serviceDate = data.serviceDate;
  if (data.status !== undefined) patch.status = data.status;
  if (data.paymentMethod !== undefined) {
    patch.paymentMethod = data.paymentMethod === null ? null : normNotes(data.paymentMethod);
  }
  if (data.notes !== undefined) {
    patch.notes = data.notes === null ? null : normNotes(data.notes);
  }

  const nextType = data.type ?? existing.type;
  const existingSup = Number(existing.homeServiceSupplement ?? 0);
  const nextSup =
    data.homeServiceSupplement !== undefined ? Number(data.homeServiceSupplement ?? 0) : existingSup;

  if (data.homeServiceSupplement !== undefined) {
    patch.homeServiceSupplement =
      data.homeServiceSupplement === null || nextSup === 0 ? null : moneyDecimal(nextSup);
  }

  const mustRecalcEconomics =
    data.type !== undefined ||
    data.selectedPartId !== undefined ||
    data.quantity !== undefined ||
    data.sparePartLines !== undefined ||
    data.manualLines !== undefined ||
    data.extraLines !== undefined ||
    data.costPrice !== undefined ||
    data.salePrice !== undefined ||
    data.homeServiceSupplement !== undefined;

  const shouldSyncConceptLines =
    data.manualLines !== undefined || data.extraLines !== undefined;

  const leavesSpare =
    existing.type === ServiceType.SPARE_PART_SALE && nextType !== ServiceType.SPARE_PART_SALE;
  const entersSpare =
    existing.type !== ServiceType.SPARE_PART_SALE && nextType === ServiceType.SPARE_PART_SALE;

  if (entersSpare) {
    const merged = mergeSparePartLines(data.sparePartLines ?? []);
    const legacySingle =
      !!data.selectedPartId &&
      data.quantity !== undefined &&
      data.quantity !== null &&
      data.quantity >= 1;
    if (merged.length === 0 && !legacySingle) {
      throw new Error("SPARE_PART_INVALID");
    }
  }

  let spareLinesSync: SpareLine[] | null = null;

  if (mustRecalcEconomics) {
    if (isCompleted) {
      if (nextType === ServiceType.SPARE_PART_SALE) {
        const cost = data.costPrice !== undefined ? data.costPrice : Number(existing.costPrice);
        const existingSaleTotal = Number(existing.salePrice);
        const manualSaleBase =
          data.salePrice !== undefined ? data.salePrice : existingSaleTotal - existingSup;
        const saleTotal = manualSaleBase + nextSup;
        patch.costPrice = moneyDecimal(cost);
        patch.salePrice = moneyDecimal(saleTotal);
        patch.profit = moneyDecimal(saleTotal - cost);
      } else {
        const cost = data.costPrice ?? Number(existing.costPrice);
        const baseSale =
          data.salePrice !== undefined ? data.salePrice : Number(existing.salePrice) - existingSup;
        const saleTotal = baseSale + nextSup;
        patch.costPrice = moneyDecimal(cost);
        patch.salePrice = moneyDecimal(saleTotal);
        patch.profit = moneyDecimal(saleTotal - cost);
      }
    } else if (nextType === ServiceType.SPARE_PART_SALE) {
      spareLinesSync = await effectiveSpareLinesForPatch(existing, data);
      await validateSpareLinesStock(spareLinesSync);

      const parts = await prisma.part.findMany({
        where: { id: { in: spareLinesSync.map((l) => l.partId) } }
      });
      const spareCost = spareCostTotal(spareLinesSync, parts);
      const extraCostSum = sumServiceExtraLinesCost(existing.extraLines ?? []);
      const costTotal = spareCost + extraCostSum;

      const existingSaleTotal = Number(existing.salePrice);
      const manualSaleBase =
        data.salePrice !== undefined ? data.salePrice : existingSaleTotal - existingSup;
      const saleTotal = manualSaleBase + nextSup;

      patch.costPrice = moneyDecimal(costTotal);
      patch.salePrice = moneyDecimal(saleTotal);
      patch.profit = moneyDecimal(saleTotal - costTotal);
      patch.selectedPartId = spareLinesSync.length === 1 ? spareLinesSync[0].partId : null;
      patch.quantity = spareLinesSync.length === 1 ? spareLinesSync[0].quantity : null;
    } else {
      const cost = data.costPrice ?? Number(existing.costPrice);
      const baseSale =
        data.salePrice !== undefined ? data.salePrice : Number(existing.salePrice) - existingSup;
      const saleTotal = baseSale + nextSup;
      patch.costPrice = moneyDecimal(cost);
      patch.salePrice = moneyDecimal(saleTotal);
      patch.profit = moneyDecimal(saleTotal - cost);
      patch.selectedPartId = null;
      patch.quantity = null;
    }
  }

  const shouldSyncSpareLines =
    !isCompleted &&
    (leavesSpare || (mustRecalcEconomics && nextType === ServiceType.SPARE_PART_SALE && spareLinesSync));

  let manualSnapshotsForSync: ManualSnapshot[] | null = null;
  let templateSnapshotsForSync: ExtraSnapshot[] | null = null;
  if (shouldSyncConceptLines) {
    if (isCompleted && (data.sparePartLines !== undefined || data.selectedPartId !== undefined)) {
      throw new Error("SERVICE_COMPLETED_LINES_LOCKED");
    }
    manualSnapshotsForSync = resolveManualLineSnapshots(
      data.manualLines !== undefined
        ? data.manualLines
        : (existing.extraLines ?? [])
            .filter((l) => l.extraTemplateId == null)
            .map((l) => ({
              name: l.name,
              description: l.description,
              quantity: l.quantity,
              unitCost: Number(l.unitCost),
              unitSalePrice: Number(l.unitSalePrice)
            }))
    ).snapshots;
    templateSnapshotsForSync = (
      await resolveExtraLineSnapshots(
        data.extraLines !== undefined
          ? data.extraLines
          : (existing.extraLines ?? [])
              .filter((l) => l.extraTemplateId != null)
              .map((l) => ({
                extraTemplateId: l.extraTemplateId!,
                quantity: l.quantity,
                unitCost: Number(l.unitCost),
                unitSalePrice: Number(l.unitSalePrice)
              }))
      )
    ).snapshots;

    let conceptCost = 0;
    let conceptSale = 0;
    for (const s of manualSnapshotsForSync) {
      conceptCost += s.unitCost * s.quantity;
      conceptSale += s.unitSalePrice * s.quantity;
    }
    for (const s of templateSnapshotsForSync) {
      conceptCost += s.unitCost * s.quantity;
      conceptSale += s.unitSalePrice * s.quantity;
    }

    if (nextType === ServiceType.SPARE_PART_SALE) {
      const spareRows =
        spareLinesSync ??
        (existing.sparePartLines?.length
          ? existing.sparePartLines.map((l) => ({ partId: l.partId, quantity: l.quantity }))
          : existing.selectedPartId && existing.quantity
            ? [{ partId: existing.selectedPartId, quantity: existing.quantity }]
            : []);
      const parts = await prisma.part.findMany({
        where: { id: { in: spareRows.map((l) => l.partId) } }
      });
      const spareCost = spareRows.length > 0 ? spareCostTotal(spareRows, parts) : 0;
      const costTotal = spareCost + conceptCost;
      const piecesSaleBase =
        data.salePrice !== undefined
          ? data.salePrice
          : Math.max(0, Number(existing.salePrice) - existingSup - conceptSale);
      const saleTotal = piecesSaleBase + nextSup + conceptSale;
      patch.costPrice = moneyDecimal(costTotal);
      patch.salePrice = moneyDecimal(saleTotal);
      patch.profit = moneyDecimal(saleTotal - costTotal);
    } else {
      const cost = data.costPrice !== undefined ? data.costPrice : conceptCost;
      const saleTotal = conceptSale + nextSup;
      patch.costPrice = moneyDecimal(cost);
      patch.salePrice = moneyDecimal(saleTotal);
      patch.profit = moneyDecimal(saleTotal - cost);
      patch.selectedPartId = null;
      patch.quantity = null;
    }
  }

  return prisma.$transaction(async (tx) => {
    if (shouldSyncConceptLines && manualSnapshotsForSync && templateSnapshotsForSync) {
      await tx.serviceExtraLine.deleteMany({ where: { serviceId: id } });
      await persistServiceLineSnapshots(tx, id, manualSnapshotsForSync, templateSnapshotsForSync);
    }

    if (shouldSyncSpareLines) {
      if (leavesSpare) {
        await tx.serviceSparePartLine.deleteMany({ where: { serviceId: id } });
      } else {
        await tx.serviceSparePartLine.deleteMany({ where: { serviceId: id } });
        await tx.serviceSparePartLine.createMany({
          data: spareLinesSync!.map((l) => ({
            id: randomUUID(),
            serviceId: id,
            partId: l.partId,
            quantity: l.quantity
          }))
        });
      }
    }

    return tx.service.update({
      where: { id },
      data: patch,
      include: serviceInclude
    });
  });
}

export async function deleteService(id: string) {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("SERVICE_NOT_FOUND");
  }
  await prisma.service.delete({ where: { id } });
}

function linesForCompletion(existing: {
  type: ServiceType;
  selectedPartId: string | null;
  quantity: number | null;
  sparePartLines?: { partId: string; quantity: number }[];
}): SpareLine[] {
  if (existing.type !== ServiceType.SPARE_PART_SALE) {
    return [];
  }
  const spl = existing.sparePartLines;
  if (spl && spl.length > 0) {
    return spl.map((l) => ({ partId: l.partId, quantity: l.quantity }));
  }
  if (existing.selectedPartId && existing.quantity) {
    return [{ partId: existing.selectedPartId, quantity: existing.quantity }];
  }
  return [];
}

export async function completeService(id: string) {
  const existing = await prisma.service.findUnique({
    where: { id },
    include: serviceInclude
  });
  if (!existing) {
    throw new Error("SERVICE_NOT_FOUND");
  }
  if (existing.status === ServiceStatus.COMPLETED) {
    throw new Error("SERVICE_ALREADY_COMPLETED");
  }
  if (existing.status === ServiceStatus.CANCELLED) {
    throw new Error("SERVICE_CANCELLED");
  }

  const toShip = linesForCompletion(existing);

  return prisma.$transaction(async (tx) => {
    for (const line of toShip) {
      const part = await tx.part.findUnique({ where: { id: line.partId } });
      if (!part) {
        throw new Error("PART_NOT_FOUND");
      }
      if (part.inventoryKind !== InventoryKind.PART) {
        throw new Error("SPARE_PART_REQUIRES_PART_KIND");
      }
      if (part.stock < line.quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }
      await tx.part.update({
        where: { id: line.partId },
        data: { stock: part.stock - line.quantity }
      });
    }

    await tx.service.update({
      where: { id },
      data: { status: ServiceStatus.COMPLETED }
    });

    return tx.service.findUnique({
      where: { id },
      include: serviceInclude
    });
  });
}

export async function addServiceExtraLine(serviceId: string, payload: unknown) {
  const data = addServiceExtraLineBodySchema.parse(payload);
  const existing = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!existing) {
    throw new Error("SERVICE_NOT_FOUND");
  }
  if (existing.status === ServiceStatus.COMPLETED) {
    throw new Error("SERVICE_COMPLETED_LINES_LOCKED");
  }

  const { snapshots } = await resolveExtraLineSnapshots([data]);
  const snap = snapshots[0];

  return prisma.$transaction(async (tx) => {
    await tx.serviceExtraLine.create({
      data: {
        serviceId,
        extraTemplateId: snap.extraTemplateId,
        name: snap.name,
        description: snap.description,
        quantity: snap.quantity,
        unitCost: moneyDecimal(snap.unitCost),
        unitSalePrice: moneyDecimal(snap.unitSalePrice)
      }
    });
    const deltaCost = snap.unitCost * snap.quantity;
    const deltaSale = snap.unitSalePrice * snap.quantity;
    const nextCost = Number(existing.costPrice) + deltaCost;
    const nextSale = Number(existing.salePrice) + deltaSale;
    await tx.service.update({
      where: { id: serviceId },
      data: {
        costPrice: moneyDecimal(nextCost),
        salePrice: moneyDecimal(nextSale),
        profit: moneyDecimal(nextSale - nextCost)
      }
    });
    return tx.service.findUnique({ where: { id: serviceId }, include: serviceInclude });
  });
}

export async function patchServiceExtraLine(serviceId: string, lineId: string, payload: unknown) {
  const data = patchServiceExtraLineSchema.parse(payload);
  const existing = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!existing) {
    throw new Error("SERVICE_NOT_FOUND");
  }
  if (existing.status === ServiceStatus.COMPLETED) {
    throw new Error("SERVICE_COMPLETED_LINES_LOCKED");
  }

  const line = await prisma.serviceExtraLine.findFirst({
    where: { id: lineId, serviceId }
  });
  if (!line) {
    throw new Error("SERVICE_EXTRA_LINE_NOT_FOUND");
  }

  const oldCost = Number(line.unitCost) * line.quantity;
  const oldSale = Number(line.unitSalePrice) * line.quantity;

  const nextQty = data.quantity ?? line.quantity;
  const nextUC = data.unitCost !== undefined ? data.unitCost : Number(line.unitCost);
  const nextUS = data.unitSalePrice !== undefined ? data.unitSalePrice : Number(line.unitSalePrice);
  const newCost = nextUC * nextQty;
  const newSale = nextUS * nextQty;
  const deltaCost = newCost - oldCost;
  const deltaSale = newSale - oldSale;

  return prisma.$transaction(async (tx) => {
    await tx.serviceExtraLine.update({
      where: { id: lineId },
      data: {
        quantity: nextQty,
        unitCost: moneyDecimal(nextUC),
        unitSalePrice: moneyDecimal(nextUS)
      }
    });
    const nextServiceCost = Number(existing.costPrice) + deltaCost;
    const nextServiceSale = Number(existing.salePrice) + deltaSale;
    await tx.service.update({
      where: { id: serviceId },
      data: {
        costPrice: moneyDecimal(nextServiceCost),
        salePrice: moneyDecimal(nextServiceSale),
        profit: moneyDecimal(nextServiceSale - nextServiceCost)
      }
    });
    return tx.service.findUnique({ where: { id: serviceId }, include: serviceInclude });
  });
}

export async function deleteServiceExtraLine(serviceId: string, lineId: string) {
  const existing = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!existing) {
    throw new Error("SERVICE_NOT_FOUND");
  }
  if (existing.status === ServiceStatus.COMPLETED) {
    throw new Error("SERVICE_COMPLETED_LINES_LOCKED");
  }

  const line = await prisma.serviceExtraLine.findFirst({
    where: { id: lineId, serviceId }
  });
  if (!line) {
    throw new Error("SERVICE_EXTRA_LINE_NOT_FOUND");
  }

  const subCost = Number(line.unitCost) * line.quantity;
  const subSale = Number(line.unitSalePrice) * line.quantity;

  return prisma.$transaction(async (tx) => {
    await tx.serviceExtraLine.delete({ where: { id: lineId } });
    const nextServiceCost = Number(existing.costPrice) - subCost;
    const nextServiceSale = Number(existing.salePrice) - subSale;
    await tx.service.update({
      where: { id: serviceId },
      data: {
        costPrice: moneyDecimal(nextServiceCost),
        salePrice: moneyDecimal(nextServiceSale),
        profit: moneyDecimal(nextServiceSale - nextServiceCost)
      }
    });
    return tx.service.findUnique({ where: { id: serviceId }, include: serviceInclude });
  });
}

type MonthlyBucket = {
  month: number;
  year: number;
  servicesCount: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
};

export async function getMonthlyServicesSummary(): Promise<MonthlyBucket[]> {
  const rows = await prisma.service.findMany({
    where: { status: ServiceStatus.COMPLETED },
    select: {
      serviceDate: true,
      salePrice: true,
      costPrice: true,
      profit: true
    }
  });

  const map = new Map<string, MonthlyBucket>();

  for (const row of rows) {
    const d = row.serviceDate;
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const prev = map.get(key) ?? {
      month,
      year,
      servicesCount: 0,
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0
    };
    prev.servicesCount += 1;
    prev.totalRevenue += Number(row.salePrice);
    prev.totalCost += Number(row.costPrice);
    prev.totalProfit += Number(row.profit);
    map.set(key, prev);
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
}
