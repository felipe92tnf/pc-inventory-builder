import type { MoneyValue, Part } from "./part";

export type BuildStatus = "DRAFT" | "CONFIRMED" | "SOLD";

export type BuildItem = {
  id: string;
  buildId: string;
  partId: string;
  quantity: number;
  /** Coste unitario snapshot en esta linea del montaje. */
  unitCost: MoneyValue;
  /** Precio de venta unitario de esta linea (ajustable sin tocar inventario). */
  unitSalePrice: MoneyValue;
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
  /** sum(quantity * unitSalePrice) por lineas del montaje. */
  computedSaleTotal: number;
  /** Precio de venta efectivo (saleTotalOverride o calculado). */
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
  /** Si se omite, se usa el precio de venta del inventario al crear la linea. */
  unitSalePrice?: number;
};

export type UpdateBuildItemPayload = {
  quantity?: number;
  unitSalePrice?: number;
};
