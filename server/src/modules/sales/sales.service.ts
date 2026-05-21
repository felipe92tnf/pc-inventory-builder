import { BuildStatus, Prisma, SaleStatus } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { finalizePricing } from "../builds/builds.service.js";
import { customerDataForEntity } from "../customers/customers.resolve.js";
import { findActiveSaleForBuild } from "./sales.revert.service.js";
import { createSaleFromBuildSchema, patchSaleSchema } from "./sales.validators.js";

function moneyDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(Math.round(value * 100) / 100);
}

const SELLABLE_FOR_NEW_SALE: Set<BuildStatus> = new Set([
  BuildStatus.CONFIRMED,
  BuildStatus.PENDING_PAYMENT,
  BuildStatus.RESERVED
]);

function partialCompletionCostRatio(build: {
  status: BuildStatus;
  reservationDeposit: { toString(): string } | null;
  reservationRemaining: { toString(): string } | null;
  pendingPaymentPaid: { toString(): string } | null;
  pendingPaymentRemaining: { toString(): string } | null;
}): number | null {
  if (build.status === BuildStatus.RESERVED) {
    const d = build.reservationDeposit != null ? Number(build.reservationDeposit) : 0;
    const r = build.reservationRemaining != null ? Number(build.reservationRemaining) : 0;
    const sum = d + r;
    if (sum > 0) return Math.min(1, Math.max(0, r / sum));
  }
  if (build.status === BuildStatus.PENDING_PAYMENT) {
    const d = build.pendingPaymentPaid != null ? Number(build.pendingPaymentPaid) : 0;
    const r = build.pendingPaymentRemaining != null ? Number(build.pendingPaymentRemaining) : 0;
    const sum = d + r;
    if (sum > 0) return Math.min(1, Math.max(0, r / sum));
  }
  return null;
}

export async function createSaleFromBuild(buildId: string, payload: unknown) {
  const data = createSaleFromBuildSchema.parse(payload);

  const build = await prisma.build.findUnique({
    where: { id: buildId },
    include: {
      items: { include: { part: true } },
      extraLines: { include: { extraTemplate: true } }
    }
  });

  if (!build) {
    throw new Error("BUILD_NOT_FOUND");
  }
  if (build.status === BuildStatus.PENDING_PICKUP) {
    throw new Error("BUILD_ALREADY_PENDING_PICKUP");
  }
  if (!SELLABLE_FOR_NEW_SALE.has(build.status)) {
    throw new Error("BUILD_NOT_ASSEMBLED");
  }
  const activeSale = await findActiveSaleForBuild(buildId);
  if (activeSale) {
    throw new Error("BUILD_ALREADY_SOLD");
  }

  const pricing = finalizePricing(build.items, build.saleTotalOverride, build.extraLines ?? []);
  const fullTotalCost = pricing.totalCost;
  const suggestedSale =
    data.finalSalePrice !== undefined ? data.finalSalePrice : pricing.totalSale;

  const ratio = partialCompletionCostRatio(build);
  const allocatedCost =
    ratio != null && ratio > 0 && ratio <= 1
      ? Math.round(fullTotalCost * ratio * 100) / 100
      : fullTotalCost;
  const profit = Math.round((suggestedSale - allocatedCost) * 100) / 100;

  const soldAt = data.soldAt ?? new Date();
  const customerEmail =
    data.customerEmail === undefined || data.customerEmail === "" ? null : data.customerEmail;

  const pendingPickup = data.pendingPickup === true;
  const pickupConfirmedAt = pendingPickup ? null : soldAt;
  const nextBuildStatus = pendingPickup ? BuildStatus.PENDING_PICKUP : BuildStatus.SOLD;

  const customer = await customerDataForEntity({
    customerId: data.customerId ?? build.customerId,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail
  });

  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        buildId,
        customerId: customer.customerId,
        customerName: customer.customerName,
        customerPhone: customer.customerPhone ?? "",
        customerEmail: customer.customerEmail,
        finalSalePrice: moneyDecimal(suggestedSale),
        totalCost: moneyDecimal(allocatedCost),
        profit: moneyDecimal(profit),
        soldAt,
        pickupConfirmedAt,
        paymentMethod: data.paymentMethod ?? null,
        warrantyMonths: data.warrantyMonths ?? null,
        notes: data.notes ?? null
      }
    });

    await tx.build.update({
      where: { id: buildId },
      data: {
        status: nextBuildStatus,
        reservationDeposit: null,
        reservationRemaining: null,
        pendingPaymentPaid: null,
        pendingPaymentRemaining: null,
        partialAccruedAt: null
      }
    });

    return tx.sale.findUnique({
      where: { id: sale.id },
      include: {
        build: {
          include: {
            items: { include: { part: true } },
            extraLines: { include: { extraTemplate: true } }
          }
        }
      }
    });
  });
}

export async function listSales() {
  return prisma.sale.findMany({
    orderBy: { soldAt: "desc" },
    include: {
      build: {
        select: {
          id: true,
          name: true,
          status: true,
          confirmedAt: true,
          saleTotalOverride: true,
          createdAt: true
        }
      }
    }
  });
}

export async function getSale(id: string) {
  return prisma.sale.findUnique({
    where: { id },
    include: {
      build: {
        include: {
          items: { include: { part: true } },
          extraLines: { include: { extraTemplate: true } }
        }
      }
    }
  });
}

export async function patchSale(id: string, payload: unknown) {
  const data = patchSaleSchema.parse(payload);

  const existing = await prisma.sale.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("SALE_NOT_FOUND");
  }
  if (existing.status === SaleStatus.REVERTED) {
    throw new Error("SALE_REVERTED_LOCKED");
  }

  const nextFinal =
    data.finalSalePrice !== undefined ? data.finalSalePrice : Number(existing.finalSalePrice);
  const totalCost = Number(existing.totalCost);
  const nextProfit = nextFinal - totalCost;

  const patch: Prisma.SaleUpdateInput = {};

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
        data.customerEmail !== undefined
          ? data.customerEmail === null || data.customerEmail === ""
            ? null
            : data.customerEmail
          : existing.customerEmail
    });
    if (customer.customerId) {
      patch.customer = { connect: { id: customer.customerId } };
    }
    patch.customerName = customer.customerName;
    patch.customerPhone = customer.customerPhone ?? "";
    patch.customerEmail = customer.customerEmail;
  }
  if (data.finalSalePrice !== undefined) {
    patch.finalSalePrice = moneyDecimal(data.finalSalePrice);
    patch.profit = moneyDecimal(nextProfit);
  }
  if (data.paymentMethod !== undefined) {
    patch.paymentMethod = data.paymentMethod === null ? null : data.paymentMethod.trim() || null;
  }
  if (data.warrantyMonths !== undefined) patch.warrantyMonths = data.warrantyMonths;
  if (data.notes !== undefined) {
    patch.notes =
      data.notes === null ? null : data.notes.trim() === "" ? null : data.notes.trim();
  }
  if (data.soldAt !== undefined) patch.soldAt = data.soldAt;
  if (data.pickupConfirmedAt !== undefined) {
    patch.pickupConfirmedAt = data.pickupConfirmedAt;
  }

  return prisma.$transaction(async (tx) => {
    await tx.sale.update({
      where: { id },
      data: patch
    });

    if (data.pickupConfirmedAt !== undefined && data.pickupConfirmedAt != null) {
      const saleRow = await tx.sale.findUnique({ where: { id }, select: { buildId: true } });
      if (saleRow) {
        const b = await tx.build.findUnique({
          where: { id: saleRow.buildId },
          select: { status: true }
        });
        if (b?.status === BuildStatus.PENDING_PICKUP) {
          await tx.build.update({
            where: { id: saleRow.buildId },
            data: { status: BuildStatus.SOLD }
          });
        }
      }
    }

    return tx.sale.findUnique({
      where: { id },
      include: {
        build: {
          include: {
            items: { include: { part: true } },
            extraLines: { include: { extraTemplate: true } }
          }
        }
      }
    });
  });
}

export async function deleteSale(id: string) {
  const sale = await prisma.sale.findUnique({ where: { id } });
  if (!sale) {
    throw new Error("SALE_NOT_FOUND");
  }
  if (sale.status === SaleStatus.REVERTED) {
    throw new Error("SALE_REVERTED_LOCKED");
  }

  await prisma.$transaction(async (tx) => {
    await tx.sale.delete({ where: { id } });
    if (sale.isImported) {
      await tx.build.delete({ where: { id: sale.buildId } });
    } else {
      await tx.build.update({
        where: { id: sale.buildId },
        data: { status: BuildStatus.CONFIRMED }
      });
    }
  });
}

type MonthlyBucket = {
  month: number;
  year: number;
  salesCount: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
};

export async function getMonthlySalesSummary(): Promise<MonthlyBucket[]> {
  const sales = await prisma.sale.findMany({
    where: { status: SaleStatus.COMPLETED },
    select: {
      soldAt: true,
      finalSalePrice: true,
      totalCost: true,
      profit: true
    }
  });

  const map = new Map<string, MonthlyBucket>();

  for (const row of sales) {
    const d = row.soldAt;
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const prev = map.get(key) ?? {
      month,
      year,
      salesCount: 0,
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0
    };
    prev.salesCount += 1;
    prev.totalRevenue += Number(row.finalSalePrice);
    prev.totalCost += Number(row.totalCost);
    prev.totalProfit += Number(row.profit);
    map.set(key, prev);
  }

  const partialBuilds = await prisma.build.findMany({
    where: {
      status: { in: [BuildStatus.RESERVED, BuildStatus.PENDING_PAYMENT] },
      partialAccruedAt: { not: null }
    },
    include: {
      items: { include: { part: true } },
      extraLines: { include: { extraTemplate: true } }
    }
  });

  for (const b of partialBuilds) {
    if (!b.partialAccruedAt) continue;
    const advance =
      b.status === BuildStatus.RESERVED
        ? Number(b.reservationDeposit ?? 0)
        : Number(b.pendingPaymentPaid ?? 0);
    if (!Number.isFinite(advance) || advance <= 0) continue;

    const pricing = finalizePricing(b.items, b.saleTotalOverride, b.extraLines ?? []);
    const totalSale = pricing.totalSale;
    const totalCost = pricing.totalCost;
    const ratio = totalSale > 0 ? Math.min(1, advance / totalSale) : 0;
    const costShare = Math.round(totalCost * ratio * 100) / 100;
    const revenue = advance;
    const profit = Math.round((revenue - costShare) * 100) / 100;

    const d = b.partialAccruedAt;
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const prev = map.get(key) ?? {
      month,
      year,
      salesCount: 0,
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0
    };
    prev.totalRevenue += revenue;
    prev.totalCost += costShare;
    prev.totalProfit += profit;
    map.set(key, prev);
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
}
