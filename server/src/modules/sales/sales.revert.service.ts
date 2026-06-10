import { BuildStatus, SaleStatus } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { isPrebuiltInventoryBuild } from "../builds/builds.stock.js";
import {
  activeSaleForBuildWhere,
  isSaleCompleted,
  isSaleReverted
} from "./sales.status.js";

const REVERT_DEBUG = "[sale-revert-debug]";

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
  if (isSaleReverted(sale.status)) {
    throw new Error("SALE_ALREADY_REVERTED");
  }
  if (!isSaleCompleted(sale.status)) {
    throw new Error("SALE_NOT_ACTIVE");
  }

  console.log(REVERT_DEBUG, "BEFORE", {
    saleId: sale.id,
    buildId: sale.buildId,
    buildStatus: sale.build.status,
    isPrebuiltInventoryBuild: isPrebuiltInventoryBuild(sale.build),
    partIds: sale.build.items.map((item) => ({
      partId: item.partId,
      quantity: item.quantity,
      inventoryKind: item.part.inventoryKind,
      stock: item.part.stock
    }))
  });

  const result = await prisma.$transaction(async (tx) => {
    // El stock se descuenta al confirmar el montaje, no al registrar la venta.
    // Revertir la venta solo reabre el montaje; el stock sigue comprometido hasta volver a borrador.

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

  console.log(REVERT_DEBUG, "AFTER", {
    saleId: result?.id,
    saleStatus: result?.status,
    buildId: result?.buildId,
    buildStatus: result?.build.status,
    partIds: result?.build.items.map((item) => ({
      partId: item.partId,
      quantity: item.quantity,
      inventoryKind: item.part.inventoryKind,
      stock: item.part.stock
    }))
  });

  return result;
}

export async function findActiveSaleForBuild(buildId: string) {
  return prisma.sale.findFirst({
    where: activeSaleForBuildWhere(buildId),
    orderBy: { soldAt: "desc" }
  });
}
