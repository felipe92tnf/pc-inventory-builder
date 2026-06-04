import type { Build, BuildExtraLine, BuildItem } from "./build";

/** Frase exacta requerida por la API para revertir un lote de importación. */
export const SALES_IMPORT_REVERT_CONFIRM_PHRASE = "REVERTIR IMPORTACIÓN";

export type SaleStatus = "COMPLETED" | "REVERTED";

export type Sale = {
  id: string;
  buildId: string;
  /** Ausente o null en ventas antiguas = completada. */
  status?: SaleStatus | null;
  revertedAt?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  finalSalePrice: number;
  /** Reserva/anticipo ya cobrado al registrar la venta (no resta del precio total). */
  amountPaidAtSale?: number | null;
  totalCost: number;
  profit: number;
  soldAt: string;
  paymentMethod: string | null;
  warrantyMonths: number | null;
  notes: string | null;
  /** Null = cobrado, pendiente de entrega (no cuenta en listado de PCs entregados). */
  pickupConfirmedAt?: string | null;
  /** Venta creada por importación Excel. */
  isImported?: boolean;
  /** Lote de la misma confirmación de importación (null en ventas manuales o importes antiguos). */
  importBatchId?: string | null;
  /** Fecha/hora en que se confirmó la importación del lote. */
  importedAt?: string | null;
  /** Nombre del archivo de la importación (lote). */
  importFileName?: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Respuesta de GET /sales */
export type SaleListRow = Sale & {
  build: Pick<Build, "id" | "name" | "status" | "confirmedAt" | "saleTotalOverride" | "createdAt">;
};

/** Respuesta de GET /sales/:id */
export type SaleDetail = Sale & {
  build: Omit<Build, "items" | "extraLines"> & {
    items: BuildItem[];
    extraLines?: BuildExtraLine[];
    totalCost?: number;
    computedSaleTotal?: number;
    totalSale?: number;
    profit?: number;
  };
};

export type MonthlySalesSummaryRow = {
  month: number;
  year: number;
  salesCount: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
};

export type CreateSaleFromBuildPayload = {
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  finalSalePrice?: number;
  paymentMethod?: string | null;
  warrantyMonths?: number | null;
  notes?: string | null;
  soldAt?: string;
  /** Cobrado pero el PC sigue en tienda hasta confirmar recogida. */
  pendingPickup?: boolean;
};

export type PatchSalePayload = {
  customerId?: string | null;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string | null;
  finalSalePrice?: number;
  paymentMethod?: string | null;
  warrantyMonths?: number | null;
  notes?: string | null;
  soldAt?: string;
  pickupConfirmedAt?: string | null;
};

export type SalesImportPreviewRow = {
  sheetRow: number;
  soldAt: string | null;
  customerName: string | null;
  description: string | null;
  totalCost: number | null;
  finalSalePrice: number | null;
  customerPhone: string | null;
  errors: string[];
  profitCalculated: number | null;
  ok: boolean;
};

export type SalesImportConfirmPayload = {
  rows: {
    sheetRow: number;
    soldAt: string;
    customerName: string;
    description?: string | null;
    totalCost: number;
    finalSalePrice: number;
    customerPhone?: string | null;
  }[];
  /** Nombre del archivo Excel/CSV importado (se muestra en el historial de lotes). */
  sourceFileName?: string;
};

export type SalesImportConfirmResult = {
  created: number;
  failed: { sheetRow: number; message: string }[];
  importBatchId: string;
  importedAt: string;
};

export type SalesImportBatchRow = {
  batchId: string;
  importedAt: string | null;
  /** Nombre del archivo de origen (si se guardó en la importación). */
  sourceFileName: string | null;
  salesCount: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  isLegacyUnbatched: boolean;
};

export type SalesImportBatchPreview = {
  batchId: string;
  isLegacyUnbatched: boolean;
  sourceFileName: string | null;
  salesCount: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  samples: {
    id: string;
    customerName: string;
    soldAt: string;
    finalSalePrice: number;
    profit: number;
  }[];
};
