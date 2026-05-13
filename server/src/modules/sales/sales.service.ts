import { BuildStatus, Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { finalizePricing } from "../builds/builds.service.js";
import { createSaleFromBuildSchema, patchSaleSchema } from "./sales.validators.js";

function moneyDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(Math.round(value * 100) / 100);
}

export async function createSaleFromBuild(buildId: string, payload: unknown) {
  const data = createSaleFromBuildSchema.parse(payload);

  const build = await prisma.build.findUnique({
    where: { id: buildId },
    include: { items: { include: { part: true } }, sale: true }
  });

  if (!build) {
    throw new Error("BUILD_NOT_FOUND");
  }
  if (build.status !== BuildStatus.CONFIRMED) {
    throw new Error("BUILD_NOT_ASSEMBLED");
  }
  if (build.sale) {
    throw new Error("BUILD_ALREADY_SOLD");
  }

  const pricing = finalizePricing(build.items, build.saleTotalOverride);
  const totalCost = pricing.totalCost;
  const suggestedSale =
    data.finalSalePrice !== undefined ? data.finalSalePrice : pricing.totalSale;
  const profit = suggestedSale - totalCost;

  const soldAt = data.soldAt ?? new Date();
  const customerEmail =
    data.customerEmail === undefined || data.customerEmail === "" ? null : data.customerEmail;

  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        buildId,
        customerName: data.customerName.trim(),
        customerPhone: data.customerPhone.trim(),
        customerEmail,
        finalSalePrice: moneyDecimal(suggestedSale),
        totalCost: moneyDecimal(totalCost),
        profit: moneyDecimal(profit),
        soldAt,
        paymentMethod: data.paymentMethod ?? null,
        warrantyMonths: data.warrantyMonths ?? null,
        notes: data.notes ?? null
      }
    });

    await tx.build.update({
      where: { id: buildId },
      data: { status: BuildStatus.SOLD }
    });

    return tx.sale.findUnique({
      where: { id: sale.id },
      include: {
        build: {
          include: {
            items: { include: { part: true } }
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
          items: { include: { part: true } }
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

  const nextFinal =
    data.finalSalePrice !== undefined ? data.finalSalePrice : Number(existing.finalSalePrice);
  const totalCost = Number(existing.totalCost);
  const nextProfit = nextFinal - totalCost;

  const patch: Prisma.SaleUpdateInput = {};

  if (data.customerName !== undefined) patch.customerName = data.customerName.trim();
  if (data.customerPhone !== undefined) patch.customerPhone = data.customerPhone.trim();
  if (data.customerEmail !== undefined) {
    patch.customerEmail =
      data.customerEmail === null || data.customerEmail === "" ? null : data.customerEmail;
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

  return prisma.sale.update({
    where: { id },
    data: patch,
    include: {
      build: {
        include: {
          items: { include: { part: true } }
        }
      }
    }
  });
}

export async function deleteSale(id: string) {
  const sale = await prisma.sale.findUnique({ where: { id } });
  if (!sale) {
    throw new Error("SALE_NOT_FOUND");
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

  return Array.from(map.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
}
