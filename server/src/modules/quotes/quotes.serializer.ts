import type { Part, Quote, QuoteItem } from "@prisma/client";

function num(d: unknown): number {
  return Number(d);
}

function serializePartBrief(part: Part | null) {
  if (!part) return null;
  return {
    id: part.id,
    inventoryKind: part.inventoryKind,
    name: part.name,
    category: part.category,
    condition: part.condition,
    costPrice: num(part.costPrice),
    salePrice: num(part.salePrice),
    stock: part.stock,
    description: part.description,
    notes: part.notes
  };
}

export function serializeQuoteItem(row: QuoteItem & { part: Part | null }) {
  return {
    id: row.id,
    quoteId: row.quoteId,
    partId: row.partId,
    itemType: row.itemType,
    name: row.name,
    description: row.description,
    quantity: row.quantity,
    unitCost: row.unitCost === null || row.unitCost === undefined ? null : num(row.unitCost),
    unitSalePrice: num(row.unitSalePrice),
    total: num(row.total),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    part: serializePartBrief(row.part)
  };
}

export function serializeQuote(row: Quote & { items: (QuoteItem & { part: Part | null })[] }) {
  return {
    id: row.id,
    quoteNumber: row.quoteNumber,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail,
    title: row.title,
    description: row.description,
    status: row.status,
    validUntil: row.validUntil,
    subtotal: num(row.subtotal),
    discountAmount: num(row.discountAmount),
    total: num(row.total),
    notes: row.notes,
    convertedToBuildId: row.convertedToBuildId ?? null,
    convertedAt: row.convertedAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    items: row.items.map((item) => serializeQuoteItem(item))
  };
}
