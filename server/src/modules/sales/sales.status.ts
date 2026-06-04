import { SaleStatus, type Prisma } from "@prisma/client";

/** Venta activa para métricas y reversión (incluye legacy sin status en BD). */
export function isSaleCompleted(status: SaleStatus | null | undefined): boolean {
  return status == null || status === SaleStatus.COMPLETED;
}

export function isSaleReverted(status: SaleStatus | null | undefined): boolean {
  return status === SaleStatus.REVERTED;
}

/** Ventas que cuentan en ingresos/beneficios (no revertidas). */
export function metricsSaleWhere(): Prisma.SaleWhereInput {
  return { NOT: { status: SaleStatus.REVERTED } };
}

/** Venta activa vinculada a un montaje (no revertida). */
export function activeSaleForBuildWhere(buildId: string): Prisma.SaleWhereInput {
  return {
    buildId,
    NOT: { status: SaleStatus.REVERTED }
  };
}

export function normalizeSaleStatus(status: SaleStatus | null | undefined): SaleStatus {
  return isSaleReverted(status) ? SaleStatus.REVERTED : SaleStatus.COMPLETED;
}
