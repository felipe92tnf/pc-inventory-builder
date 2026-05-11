import type { InventoryKind, PartCategory, PartCondition } from "./part";

export const QUOTE_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_ITEM_TYPES = ["INVENTORY_PART", "MANUAL_ITEM", "SERVICE"] as const;
export type QuoteItemType = (typeof QUOTE_ITEM_TYPES)[number];

/** Parte ligera incluida en lineas de presupuesto cuando viene del inventario */
export type QuotePartBrief = {
  id: string;
  inventoryKind: InventoryKind;
  name: string;
  category: PartCategory | null;
  condition: PartCondition;
  costPrice: number;
  salePrice: number;
  stock: number;
  description: string;
  notes: string | null;
};

export type QuoteItem = {
  id: string;
  quoteId: string;
  partId: string | null;
  itemType: QuoteItemType;
  name: string;
  description: string | null;
  quantity: number;
  unitCost: number | null;
  unitSalePrice: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  part: QuotePartBrief | null;
};

export type Quote = {
  id: string;
  quoteNumber: number;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  title: string;
  description: string | null;
  status: QuoteStatus;
  validUntil: string | null;
  subtotal: number;
  discountAmount: number;
  total: number;
  notes: string | null;
  /** Si se convirtió en montaje, id del `Build` creado. */
  convertedToBuildId: string | null;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: QuoteItem[];
};

export type CreateQuotePayload = {
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  title: string;
  description?: string | null;
  validUntil?: string | null;
  discountAmount?: number;
  notes?: string | null;
  status?: QuoteStatus;
};

export type PatchQuotePayload = {
  customerName?: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  title?: string;
  description?: string | null;
  validUntil?: string | null;
  discountAmount?: number;
  notes?: string | null;
  status?: QuoteStatus;
};

export type PatchQuoteStatusPayload = {
  status: QuoteStatus;
};

export type AddInventoryQuoteItemPayload = {
  itemType: "INVENTORY_PART";
  partId: string;
  quantity: number;
};

export type AddManualQuoteItemPayload = {
  itemType: "MANUAL_ITEM";
  name: string;
  description?: string | null;
  quantity: number;
  unitCost?: number | null;
  unitSalePrice: number;
};

export type AddServiceQuoteItemPayload = {
  itemType: "SERVICE";
  name: string;
  description?: string | null;
  quantity: number;
  unitCost?: number | null;
  unitSalePrice: number;
};

export type AddQuoteItemPayload =
  | AddInventoryQuoteItemPayload
  | AddManualQuoteItemPayload
  | AddServiceQuoteItemPayload;

export type PatchQuoteItemPayload = {
  name?: string;
  description?: string | null;
  quantity?: number;
  unitCost?: number | null;
  unitSalePrice?: number;
};
