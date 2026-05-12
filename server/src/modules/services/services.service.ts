import { randomUUID } from "node:crypto";
import { InventoryKind, Prisma, ServiceStatus, ServiceType } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import {
  createServiceSchema,
  listServicesQuerySchema,
  mergeSparePartLines,
  patchServiceSchema
} from "./services.validators.js";

const serviceInclude = {
  selectedPart: true,
  sparePartLines: { include: { part: true } }
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

export async function createService(payload: unknown) {
  const data = createServiceSchema.parse(payload);

  const customerEmail = normEmail(data.customerEmail ?? undefined);
  const supplement = data.homeServiceSupplement ?? 0;

  if (data.type === ServiceType.SPARE_PART_SALE) {
    const lines = resolveCreateSpareLines(data);
    await validateSpareLinesStock(lines);

    const parts = await prisma.part.findMany({
      where: { id: { in: lines.map((l) => l.partId) } }
    });
    const costTotal = spareCostTotal(lines, parts);
    const manualSale = data.salePrice!;
    const saleTotal = manualSale + supplement;
    const profit = saleTotal - costTotal;

    return prisma.service.create({
      data: {
        type: data.type,
        title: data.title.trim(),
        customerName: data.customerName.trim(),
        customerPhone: data.customerPhone.trim(),
        customerEmail,
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
      },
      include: serviceInclude
    });
  }

  const cost = data.costPrice!;
  const saleBase = data.salePrice!;
  const saleTotal = saleBase + supplement;
  const profit = saleTotal - cost;

  return prisma.service.create({
    data: {
      type: data.type,
      title: data.title.trim(),
      customerName: data.customerName.trim(),
      customerPhone: data.customerPhone.trim(),
      customerEmail,
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
    },
    include: serviceInclude
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
  if (existing.status === ServiceStatus.COMPLETED) {
    throw new Error("SERVICE_ALREADY_COMPLETED");
  }

  const patch: Prisma.ServiceUncheckedUpdateInput = {};

  if (data.type !== undefined) patch.type = data.type;
  if (data.title !== undefined) patch.title = data.title.trim();
  if (data.customerName !== undefined) patch.customerName = data.customerName.trim();
  if (data.customerPhone !== undefined) patch.customerPhone = data.customerPhone.trim();
  if (data.customerEmail !== undefined) {
    patch.customerEmail = normEmail(data.customerEmail);
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
    data.costPrice !== undefined ||
    data.salePrice !== undefined ||
    data.homeServiceSupplement !== undefined;

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
    if (nextType === ServiceType.SPARE_PART_SALE) {
      spareLinesSync = await effectiveSpareLinesForPatch(existing, data);
      await validateSpareLinesStock(spareLinesSync);

      const parts = await prisma.part.findMany({
        where: { id: { in: spareLinesSync.map((l) => l.partId) } }
      });
      const costTotal = spareCostTotal(spareLinesSync, parts);

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

  return prisma.$transaction(async (tx) => {
    if (leavesSpare) {
      await tx.serviceSparePartLine.deleteMany({ where: { serviceId: id } });
    } else if (mustRecalcEconomics && nextType === ServiceType.SPARE_PART_SALE && spareLinesSync) {
      await tx.serviceSparePartLine.deleteMany({ where: { serviceId: id } });
      await tx.serviceSparePartLine.createMany({
        data: spareLinesSync.map((l) => ({
          id: randomUUID(),
          serviceId: id,
          partId: l.partId,
          quantity: l.quantity
        }))
      });
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
