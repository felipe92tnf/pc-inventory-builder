import type { Part } from "./part";

export type BuildStatus = "DRAFT" | "CONFIRMED" | "SOLD";

export type BuildItem = {
  id: string;
  buildId: string;
  partId: string;
  quantity: number;
  part: Part;
};

export type Build = {
  id: string;
  name: string;
  notes: string | null;
  status: BuildStatus;
  confirmedAt: string | null;
  saleTotalOverride: number | string | null;
  createdAt: string;
  updatedAt: string;
  items: BuildItem[];
  totalCost?: number;
  computedSaleTotal?: number;
  totalSale?: number;
  profit?: number;
};

export type BuildDetail = Build & {
  totalCost: number;
  /** Suma de precios de venta de las piezas (sin override). */
  computedSaleTotal: number;
  /** Precio de venta efectivo (override o calculado). */
  totalSale: number;
  profit: number;
};

export type CreateBuildPayload = {
  name: string;
  notes?: string | null;
};

export type UpdateBuildPayload = Partial<CreateBuildPayload> & {
  saleTotalOverride?: number | null;
};

export type AddBuildItemPayload = {
  partId: string;
  quantity: number;
};
