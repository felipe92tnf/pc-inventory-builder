import type { Build, BuildItem } from "./build";

export type Sale = {
  id: string;
  buildId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  finalSalePrice: number;
  totalCost: number;
  profit: number;
  soldAt: string;
  paymentMethod: string | null;
  warrantyMonths: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Respuesta de GET /sales */
export type SaleListRow = Sale & {
  build: Pick<Build, "id" | "name" | "status" | "confirmedAt" | "saleTotalOverride" | "createdAt">;
};

/** Respuesta de GET /sales/:id */
export type SaleDetail = Sale & {
  build: Omit<Build, "items"> & {
    items: BuildItem[];
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
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  finalSalePrice?: number;
  paymentMethod?: string | null;
  warrantyMonths?: number | null;
  notes?: string | null;
  soldAt?: string;
};

export type PatchSalePayload = {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string | null;
  finalSalePrice?: number;
  paymentMethod?: string | null;
  warrantyMonths?: number | null;
  notes?: string | null;
  soldAt?: string;
};
