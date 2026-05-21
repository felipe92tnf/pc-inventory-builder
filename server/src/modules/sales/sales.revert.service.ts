import { BuildStatus, InventoryKind, PartCategory, Prisma, SaleStatus } from "@prisma/client";
import { prisma } from "../../db/prisma.js";

function partSkipsStockDeduction(part: {
  category: PartCategory | null;
  inventoryKind: InventoryKind;
}): boolean {
  if (part.inventoryKind === InventoryKind.PREBUILT_PC) return false;
  if (part.category === null) return false;
  return part.category === PartCategory.OS || part.category === PartCategory.LABOR;
}

export async function revertSale(saleId: string) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      build: {
        include: {
          items: { include: { part: true } }
        }
      }
    }
  });

  if (!sale) {
    throw new Error("SALE_NOT_FOUND");
  }
  if (sale.status === SaleStatus.REVERTED) {
    throw new Error("SALE_ALREADY_REVERTED");
  }
  if (sale.status !== SaleStatus.COMPLETED) {
    throw new Error("SALE_NOT_ACTIVE");
  }

  return prisma.$transaction(async (tx) => {
    if (!sale.isImported) {
      for (const item of sale.build.items) {
        if (partSkipsStockDeduction(item.part)) continue;
        await tx.part.update({
          where: { id: item.partId },
          data: { stock: { increment: item.quantity } }
        });
      }

    }

    await tx.build.update({
      where: { id: sale.buildId },
      data: {
        status: BuildStatus.CONFIRMED,
        reservationDeposit: null,
        reservationRemaining: null,
        pendingPaymentPaid: null,
        pendingPaymentRemaining: null,
        partialAccruedAt: null
      }
    });

    await tx.sale.update({
      where: { id: saleId },
      data: {
        status: SaleStatus.REVERTED,
        revertedAt: new Date()
      }
    });

    return tx.sale.findUnique({
      where: { id: saleId },
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

export async function findActiveSaleForBuild(buildId: string) {
  return prisma.sale.findFirst({
    where: { buildId, status: SaleStatus.COMPLETED }
  });
}
