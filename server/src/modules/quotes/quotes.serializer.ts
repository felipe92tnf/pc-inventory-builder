import type { ExtraTemplate, Part, Quote, QuoteItem } from "@prisma/client";

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

function serializeExtraTemplateBrief(t: ExtraTemplate | null) {
  if (!t) return null;
  return {
    id: t.id,
    name: t.name,
    category: t.category,
    active: t.active,
    defaultCostPrice: num(t.defaultCostPrice),
    defaultSalePrice: num(t.defaultSalePrice)
  };
}

export function serializeQuoteItem(row: QuoteItem & { part: Part | null; extraTemplate: ExtraTemplate | null }) {
  return {
    id: row.id,
    quoteId: row.quoteId,
    partId: row.partId,
    extraTemplateId: row.extraTemplateId,
    itemType: row.itemType,
    name: row.name,
    description: row.description,
    quantity: row.quantity,
    unitCost: row.unitCost === null || row.unitCost === undefined ? null : num(row.unitCost),
    unitSalePrice: num(row.unitSalePrice),
    total: num(row.total),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    part: serializePartBrief(row.part),
    extraTemplate: serializeExtraTemplateBrief(row.extraTemplate)
  };
}

export function serializeQuote(
  row: Quote & { items: (QuoteItem & { part: Part | null; extraTemplate: ExtraTemplate | null })[] }
) {
  const totalNum = num(row.total);
  const paymentTotalOverride = row.paymentTotal == null ? null : num(row.paymentTotal);
  const amountPaidNum = num(row.amountPaid);
  const dueTotal = paymentTotalOverride ?? totalNum;
  const paymentRemaining = Math.round((dueTotal - amountPaidNum) * 100) / 100;

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
    total: totalNum,
    paymentTotal: paymentTotalOverride,
    amountPaid: amountPaidNum,
    paymentRemaining,
    paymentDate: row.paymentDate ?? null,
    notes: row.notes,
    convertedToBuildId: row.convertedToBuildId ?? null,
    convertedAt: row.convertedAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    items: row.items.map((item) => serializeQuoteItem(item))
  };
}
