import { Prisma, ServiceStatus, ServiceType } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import {
  createServiceSchema,
  listServicesQuerySchema,
  patchServiceSchema
} from "./services.validators.js";

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

export async function createService(payload: unknown) {
  const data = createServiceSchema.parse(payload);

  const customerEmail = normEmail(data.customerEmail ?? undefined);
  const supplement = data.homeServiceSupplement ?? 0;

  if (data.type === ServiceType.SPARE_PART_SALE) {
    const part = await prisma.part.findUnique({ where: { id: data.selectedPartId! } });
    if (!part) {
      throw new Error("PART_NOT_FOUND");
    }
    const qty = data.quantity!;
    if (part.stock < qty) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    const unitCost = Number(part.costPrice);
    const costTotal = unitCost * qty;
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
        selectedPartId: data.selectedPartId,
        quantity: qty,
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
        notes: normNotes(data.notes)
      },
      include: { selectedPart: true }
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
    include: { selectedPart: true }
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
    include: { selectedPart: true }
  });
}

export async function getService(id: string) {
  return prisma.service.findUnique({
    where: { id },
    include: { selectedPart: true }
  });
}

export async function patchService(id: string, payload: unknown) {
  const data = patchServiceSchema.parse(payload);

  const existing = await prisma.service.findUnique({ where: { id } });
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
    data.costPrice !== undefined ||
    data.salePrice !== undefined ||
    data.homeServiceSupplement !== undefined;

  if (mustRecalcEconomics) {
    if (nextType === ServiceType.SPARE_PART_SALE) {
      const partId = data.selectedPartId ?? existing.selectedPartId;
      const qty = data.quantity ?? existing.quantity;
      if (!partId || !qty || qty < 1) {
        throw new Error("SPARE_PART_INVALID");
      }
      const part = await prisma.part.findUnique({ where: { id: partId } });
      if (!part) {
        throw new Error("PART_NOT_FOUND");
      }
      if (part.stock < qty) {
        throw new Error("INSUFFICIENT_STOCK");
      }
      const costTotal = Number(part.costPrice) * qty;
      const existingSaleTotal = Number(existing.salePrice);
      const manualSaleBase =
        data.salePrice !== undefined
          ? data.salePrice
          : existingSaleTotal - existingSup;
      const saleTotal = manualSaleBase + nextSup;
      patch.costPrice = moneyDecimal(costTotal);
      patch.salePrice = moneyDecimal(saleTotal);
      patch.profit = moneyDecimal(saleTotal - costTotal);
      patch.selectedPartId = partId;
      patch.quantity = qty;
    } else {
      const cost = data.costPrice ?? Number(existing.costPrice);
      const baseSale =
        data.salePrice !== undefined
          ? data.salePrice
          : Number(existing.salePrice) - existingSup;
      const saleTotal = baseSale + nextSup;
      patch.costPrice = moneyDecimal(cost);
      patch.salePrice = moneyDecimal(saleTotal);
      patch.profit = moneyDecimal(saleTotal - cost);
      patch.selectedPartId = null;
      patch.quantity = null;
    }
  }

  return prisma.service.update({
    where: { id },
    data: patch,
    include: { selectedPart: true }
  });
}

export async function deleteService(id: string) {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("SERVICE_NOT_FOUND");
  }
  await prisma.service.delete({ where: { id } });
}

export async function completeService(id: string) {
  const existing = await prisma.service.findUnique({
    where: { id },
    include: { selectedPart: true }
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

  return prisma.$transaction(async (tx) => {
    if (existing.type === ServiceType.SPARE_PART_SALE && existing.selectedPartId && existing.quantity) {
      const part = await tx.part.findUnique({ where: { id: existing.selectedPartId } });
      if (!part) {
        throw new Error("PART_NOT_FOUND");
      }
      if (part.stock < existing.quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }
      await tx.part.update({
        where: { id: existing.selectedPartId },
        data: { stock: part.stock - existing.quantity }
      });
    }

    await tx.service.update({
      where: { id },
      data: { status: ServiceStatus.COMPLETED }
    });

    return tx.service.findUnique({
      where: { id },
      include: { selectedPart: true }
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
