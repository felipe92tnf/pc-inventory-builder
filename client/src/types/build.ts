import type { MoneyValue, Part } from "./part";
import type { ExtraTemplateBrief } from "./extraTemplate";

export type BuildStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "SOLD"
  | "PENDING_PICKUP"
  | "PENDING_PAYMENT"
  | "RESERVED";

export type BuildExtraLine = {
  id: string;
  buildId: string;
  extraTemplateId: string | null;
  name: string;
  description: string;
  quantity: number;
  unitCost: MoneyValue;
  unitSalePrice: MoneyValue;
  extraTemplate: ExtraTemplateBrief | null;
};

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
  reservationDeposit?: number | null;
  reservationRemaining?: number | null;
  pendingPaymentPaid?: number | null;
  pendingPaymentRemaining?: number | null;
  partialAccruedAt?: string | null;
  saleTotalOverride: number | string | null;
  createdAt: string;
  updatedAt: string;
  items: BuildItem[];
  extraLines?: BuildExtraLine[];
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
  status?: BuildStatus;
  reservationDeposit?: number | null;
  reservationRemaining?: number | null;
  pendingPaymentPaid?: number | null;
  pendingPaymentRemaining?: number | null;
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

export type AddBuildExtraLinePayload = {
  extraTemplateId: string;
  quantity?: number;
  unitCost?: number;
  unitSalePrice?: number;
};

export type UpdateBuildExtraLinePayload = {
  quantity?: number;
  unitCost?: number;
  unitSalePrice?: number;
};
