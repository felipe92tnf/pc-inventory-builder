import { BuildStatus, Prisma, QuoteItemType, QuoteStatus } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { getBuild } from "../builds/builds.service.js";
import {
  addQuoteItemSchema,
  createQuoteSchema,
  patchQuoteItemSchema,
  patchQuoteSchema,
  patchQuoteStatusSchema
} from "./quotes.validators.js";

function moneyDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(Math.round(value * 100) / 100);
}

function lineTotalPrice(quantity: number, unitSalePrice: number): number {
  return Math.round(quantity * unitSalePrice * 100) / 100;
}

function approxSameMoney(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.005;
}

async function recalculateQuoteTotals(quoteId: string): Promise<void> {
  const items = await prisma.quoteItem.findMany({ where: { quoteId } });
  const subtotal = items.reduce((acc, row) => acc + Number(row.total), 0);

  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) return;

  const discount = Number(quote.discountAmount);
  const total = subtotal - discount;

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      subtotal: moneyDecimal(subtotal),
      total: moneyDecimal(total)
    }
  });
}

function normEmail(value: string | null | undefined): string | null {
  if (value === undefined || value === null || value.trim() === "") {
    return null;
  }
  return value.trim();
}

/** Descripcion en presupuesto: texto del inventario + estado (New / Used / Refurbished). */
function inventoryPartQuoteDescription(part: {
  description: string | null;
  condition: string;
}): string {
  const estadoLabel =
    part.condition === "NEW"
      ? "Nuevo"
      : part.condition === "USED"
        ? "Usado"
        : part.condition === "REFURBISHED"
          ? "Reacondicionado"
          : part.condition;
  const estadoPart = `Estado: ${estadoLabel}`;
  const base = part.description?.trim();
  if (base) {
    return `${base} · ${estadoPart}`;
  }
  return estadoPart;
}

/** Validez por defecto: 10 dias naturales desde la fecha de creacion. */
function defaultValidUntilFromNow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 10);
  return d;
}

export async function listQuotes() {
  return prisma.quote.findMany({
    where: { convertedToBuildId: null },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { part: true, extraTemplate: true },
        orderBy: { createdAt: "asc" }
      }
    }
  });
}

export async function getQuote(id: string) {
  return prisma.quote.findUnique({
    where: { id },
    include: {
      items: {
        include: { part: true, extraTemplate: true },
        orderBy: { createdAt: "asc" }
      }
    }
  });
}

export async function createQuote(payload: unknown) {
  const data = createQuoteSchema.parse(payload);

  const discount = data.discountAmount ?? 0;
  const customerEmail = normEmail(data.customerEmail ?? undefined);

  const validUntil =
    data.validUntil !== undefined && data.validUntil !== null
      ? data.validUntil
      : defaultValidUntilFromNow();

  return prisma.quote.create({
    data: {
      customerName: data.customerName.trim(),
      customerPhone: data.customerPhone,
      customerEmail,
      title: data.title.trim(),
      description: data.description ?? null,
      validUntil,
      ...(data.status !== undefined ? { status: data.status } : {}),
      discountAmount: moneyDecimal(discount),
      subtotal: moneyDecimal(0),
      total: moneyDecimal(0 - discount),
      notes: data.notes ?? null
    },
    include: {
      items: {
        include: { part: true, extraTemplate: true },
        orderBy: { createdAt: "asc" }
      }
    }
  });
}

export async function patchQuote(id: string, payload: unknown) {
  const data = patchQuoteSchema.parse(payload);

  const existing = await prisma.quote.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("QUOTE_NOT_FOUND");
  }

  const patch: Prisma.QuoteUpdateInput = {};

  if (data.customerName !== undefined) patch.customerName = data.customerName.trim();
  if (data.customerPhone !== undefined) patch.customerPhone = data.customerPhone;
  if (data.customerEmail !== undefined) {
    patch.customerEmail = normEmail(data.customerEmail === null ? null : data.customerEmail);
  }
  if (data.title !== undefined) patch.title = data.title.trim();
  if (data.description !== undefined) patch.description = data.description;
  if (data.validUntil !== undefined) patch.validUntil = data.validUntil;
  if (data.discountAmount !== undefined) patch.discountAmount = moneyDecimal(data.discountAmount);
  if (data.notes !== undefined) patch.notes = data.notes;
  if (data.status !== undefined) patch.status = data.status;
  if (data.paymentTotal !== undefined) {
    patch.paymentTotal = data.paymentTotal === null ? null : moneyDecimal(data.paymentTotal);
  }
  if (data.amountPaid !== undefined) patch.amountPaid = moneyDecimal(data.amountPaid);
  if (data.paymentDate !== undefined) patch.paymentDate = data.paymentDate;

  await prisma.quote.update({
    where: { id },
    data: patch
  });

  await recalculateQuoteTotals(id);

  return getQuote(id);
}

export async function deleteQuote(id: string) {
  const existing = await prisma.quote.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("QUOTE_NOT_FOUND");
  }

  await prisma.quote.delete({ where: { id } });
}

export async function patchQuoteStatus(id: string, payload: unknown) {
  const data = patchQuoteStatusSchema.parse(payload);

  const existing = await prisma.quote.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("QUOTE_NOT_FOUND");
  }

  await prisma.quote.update({
    where: { id },
    data: { status: data.status }
  });

  return getQuote(id);
}

export async function addQuoteItem(quoteId: string, payload: unknown) {
  const data = addQuoteItemSchema.parse(payload);

  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) {
    throw new Error("QUOTE_NOT_FOUND");
  }

  if (data.itemType === QuoteItemType.INVENTORY_PART) {
    const part = await prisma.part.findUnique({ where: { id: data.partId } });
    if (!part) {
      throw new Error("PART_NOT_FOUND");
    }

    const qty = data.quantity;
    const unitSale = Number(part.salePrice);
    const unitCost = Number(part.costPrice);

    const existingLine = await prisma.quoteItem.findFirst({
      where: {
        quoteId,
        partId: part.id,
        itemType: QuoteItemType.INVENTORY_PART
      }
    });

    if (existingLine) {
      const newQty = existingLine.quantity + qty;
      const saleUnit = Number(existingLine.unitSalePrice);
      const costUnit =
        existingLine.unitCost != null ? Number(existingLine.unitCost) : unitCost;
      const total = lineTotalPrice(newQty, saleUnit);

      await prisma.quoteItem.update({
        where: { id: existingLine.id },
        data: {
          quantity: newQty,
          unitCost: moneyDecimal(costUnit),
          unitSalePrice: moneyDecimal(saleUnit),
          total: moneyDecimal(total),
          name: part.name,
          description: inventoryPartQuoteDescription(part)
        }
      });
    } else {
      const total = lineTotalPrice(qty, unitSale);

      await prisma.quoteItem.create({
        data: {
          quoteId,
          partId: part.id,
          itemType: QuoteItemType.INVENTORY_PART,
          name: part.name,
          description: inventoryPartQuoteDescription(part),
          quantity: qty,
          unitCost: moneyDecimal(unitCost),
          unitSalePrice: moneyDecimal(unitSale),
          total: moneyDecimal(total)
        }
      });
    }
  } else if (data.itemType === QuoteItemType.EXTRA_TEMPLATE) {
    const template = await prisma.extraTemplate.findUnique({ where: { id: data.extraTemplateId } });
    if (!template) {
      throw new Error("EXTRA_TEMPLATE_NOT_FOUND");
    }
    if (!template.active) {
      throw new Error("EXTRA_TEMPLATE_INACTIVE");
    }

    const qty = data.quantity;
    const unitSale =
      data.unitSalePrice !== undefined && data.unitSalePrice !== null
        ? data.unitSalePrice
        : Number(template.defaultSalePrice);
    const unitCostNum =
      data.unitCost === undefined || data.unitCost === null ? Number(template.defaultCostPrice) : data.unitCost;

    const existingLine = await prisma.quoteItem.findFirst({
      where: {
        quoteId,
        extraTemplateId: template.id,
        itemType: QuoteItemType.EXTRA_TEMPLATE
      }
    });

    if (existingLine) {
      const newQty = existingLine.quantity + qty;
      const saleUnit = Number(existingLine.unitSalePrice);
      const costUnit = existingLine.unitCost != null ? Number(existingLine.unitCost) : unitCostNum;
      const total = lineTotalPrice(newQty, saleUnit);

      await prisma.quoteItem.update({
        where: { id: existingLine.id },
        data: {
          quantity: newQty,
          unitCost: moneyDecimal(costUnit),
          unitSalePrice: moneyDecimal(saleUnit),
          total: moneyDecimal(total),
          name: template.name,
          description: template.description?.trim() || null
        }
      });
    } else {
      const total = lineTotalPrice(qty, unitSale);

      await prisma.quoteItem.create({
        data: {
          quoteId,
          partId: null,
          extraTemplateId: template.id,
          itemType: QuoteItemType.EXTRA_TEMPLATE,
          name: template.name,
          description: template.description?.trim() || null,
          quantity: qty,
          unitCost: moneyDecimal(unitCostNum),
          unitSalePrice: moneyDecimal(unitSale),
          total: moneyDecimal(total)
        }
      });
    }
  } else {
    const qty = data.quantity;
    const unitSale = data.unitSalePrice;
    const unitCost =
      data.unitCost === undefined || data.unitCost === null ? null : Number(data.unitCost);
    const nameTrim = data.name.trim();

    const manualCandidates = await prisma.quoteItem.findMany({
      where: {
        quoteId,
        partId: null,
        itemType: data.itemType,
        name: nameTrim
      }
    });

    const existingManual = manualCandidates.find((row) =>
      approxSameMoney(Number(row.unitSalePrice), unitSale)
    );

    if (existingManual) {
      const newQty = existingManual.quantity + qty;
      const saleUnit = Number(existingManual.unitSalePrice);
      const total = lineTotalPrice(newQty, saleUnit);
      const mergedCost =
        existingManual.unitCost != null
          ? Number(existingManual.unitCost)
          : unitCost != null
            ? unitCost
            : null;

      await prisma.quoteItem.update({
        where: { id: existingManual.id },
        data: {
          quantity: newQty,
          total: moneyDecimal(total),
          unitSalePrice: moneyDecimal(saleUnit),
          unitCost: mergedCost === null ? null : moneyDecimal(mergedCost)
        }
      });
    } else {
      const total = lineTotalPrice(qty, unitSale);

      await prisma.quoteItem.create({
        data: {
          quoteId,
          partId: null,
          itemType: data.itemType,
          name: nameTrim,
          description: data.description ?? null,
          quantity: qty,
          unitCost: unitCost === null ? null : moneyDecimal(unitCost),
          unitSalePrice: moneyDecimal(unitSale),
          total: moneyDecimal(total)
        }
      });
    }
  }

  await recalculateQuoteTotals(quoteId);

  return getQuote(quoteId);
}

export async function patchQuoteItem(quoteId: string, itemId: string, payload: unknown) {
  const data = patchQuoteItemSchema.parse(payload);

  const item = await prisma.quoteItem.findFirst({
    where: { id: itemId, quoteId }
  });

  if (!item) {
    throw new Error("QUOTE_ITEM_NOT_FOUND");
  }

  const nextQty = data.quantity ?? item.quantity;
  const nextUnitSale = data.unitSalePrice !== undefined ? data.unitSalePrice : Number(item.unitSalePrice);
  const total = lineTotalPrice(nextQty, nextUnitSale);

  const patch: Prisma.QuoteItemUpdateInput = {};

  if (data.name !== undefined) patch.name = data.name.trim();
  if (data.description !== undefined) patch.description = data.description;
  if (data.quantity !== undefined) patch.quantity = data.quantity;
  if (data.unitSalePrice !== undefined) patch.unitSalePrice = moneyDecimal(data.unitSalePrice);
  if (data.unitCost !== undefined) {
    patch.unitCost =
      data.unitCost === null ? null : moneyDecimal(data.unitCost);
  }

  patch.total = moneyDecimal(total);

  await prisma.quoteItem.update({
    where: { id: itemId },
    data: patch
  });

  await recalculateQuoteTotals(quoteId);

  return getQuote(quoteId);
}

export async function deleteQuoteItem(quoteId: string, itemId: string) {
  const item = await prisma.quoteItem.findFirst({
    where: { id: itemId, quoteId }
  });

  if (!item) {
    throw new Error("QUOTE_ITEM_NOT_FOUND");
  }

  await prisma.quoteItem.delete({ where: { id: itemId } });

  await recalculateQuoteTotals(quoteId);

  return getQuote(quoteId);
}

function formatQuoteConversionNotes(
  quote: {
    customerName: string;
    customerPhone: string | null;
    customerEmail: string | null;
    description: string | null;
    notes: string | null;
    discountAmount: unknown;
    total: unknown;
  },
  manualLines: {
    itemType: QuoteItemType;
    name: string;
    description: string | null;
    quantity: number;
    unitSalePrice: unknown;
    total: unknown;
  }[]
): string {
  const lines: string[] = [];
  lines.push(`Cliente: ${quote.customerName}`);
  if (quote.customerPhone?.trim()) {
    lines.push(`Tel: ${quote.customerPhone.trim()}`);
  }
  if (quote.customerEmail?.trim()) {
    lines.push(`Email: ${quote.customerEmail.trim()}`);
  }
  if (quote.description?.trim()) {
    lines.push("");
    lines.push("Descripción (presupuesto):");
    lines.push(quote.description.trim());
  }
  if (quote.notes?.trim()) {
    lines.push("");
    lines.push("Notas internas (presupuesto):");
    lines.push(quote.notes.trim());
  }

  if (manualLines.length > 0) {
    lines.push("");
    lines.push("--- Líneas no copiadas al montaje (manual / servicio / sin pieza) ---");
    for (const m of manualLines) {
      const typeLabel =
        m.itemType === QuoteItemType.SERVICE
          ? "Servicio"
          : m.itemType === QuoteItemType.MANUAL_ITEM
            ? "Concepto manual"
            : m.itemType === QuoteItemType.EXTRA_TEMPLATE
              ? "Extra (plantilla)"
              : "Inventario (referencia)";
      const desc = m.description?.trim() ? ` — ${m.description.trim()}` : "";
      lines.push(
        `• [${typeLabel}] ${m.name} ×${m.quantity} @ ${Number(m.unitSalePrice).toFixed(2)} €/u → ${Number(m.total).toFixed(2)} €${desc}`
      );
    }
  }

  lines.push("");
  lines.push(`Total presupuesto aceptado (referencia venta): ${Number(quote.total).toFixed(2)} €`);
  if (Number(quote.discountAmount) > 0) {
    lines.push(`Descuento en presupuesto: ${Number(quote.discountAmount).toFixed(2)} €`);
  }

  return lines.join("\n");
}

/**
 * Acepta el presupuesto, crea un montaje en borrador con líneas de inventario y enlaza el presupuesto.
 * No descuenta stock (solo al confirmar el montaje).
 */
export async function convertQuoteToBuild(quoteId: string) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: { orderBy: { createdAt: "asc" } } }
  });

  if (!quote) {
    throw new Error("QUOTE_NOT_FOUND");
  }
  if (quote.convertedToBuildId) {
    throw new Error("QUOTE_ALREADY_CONVERTED");
  }

  const manualLines = quote.items.filter((row) => {
    if (row.itemType === QuoteItemType.EXTRA_TEMPLATE) return false;
    return (
      row.partId === null ||
      row.itemType === QuoteItemType.MANUAL_ITEM ||
      row.itemType === QuoteItemType.SERVICE
    );
  });

  const notesBody = formatQuoteConversionNotes(quote, manualLines);

  type Agg = { qty: number; costQtySum: number; saleQtySum: number };
  const byPart = new Map<string, Agg>();

  for (const row of quote.items) {
    if (
      row.partId === null ||
      row.itemType === QuoteItemType.MANUAL_ITEM ||
      row.itemType === QuoteItemType.SERVICE ||
      row.itemType === QuoteItemType.EXTRA_TEMPLATE
    ) {
      continue;
    }
    const pid = row.partId;
    const agg = byPart.get(pid) ?? { qty: 0, costQtySum: 0, saleQtySum: 0 };
    const q = row.quantity;
    const uc = row.unitCost != null ? Number(row.unitCost) : 0;
    const us = Number(row.unitSalePrice);
    agg.qty += q;
    agg.costQtySum += uc * q;
    agg.saleQtySum += us * q;
    byPart.set(pid, agg);
  }

  const convertedAt = new Date();

  const createdBuild = await prisma.$transaction(async (tx) => {
    const newBuild = await tx.build.create({
      data: {
        name: quote.title.trim(),
        notes: notesBody,
        status: BuildStatus.DRAFT,
        saleTotalOverride: moneyDecimal(Number(quote.total))
      }
    });

    for (const [partId, agg] of byPart.entries()) {
      const part = await tx.part.findUnique({ where: { id: partId } });
      if (!part) {
        throw new Error("PART_NOT_FOUND");
      }
      const qty = agg.qty;
      const unitCost = agg.costQtySum / qty;
      const unitSale = agg.saleQtySum / qty;

      await tx.buildPartItem.create({
        data: {
          buildId: newBuild.id,
          partId,
          quantity: qty,
          unitCost: moneyDecimal(unitCost),
          unitSalePrice: moneyDecimal(unitSale)
        }
      });
    }

    for (const row of quote.items) {
      if (row.itemType !== QuoteItemType.EXTRA_TEMPLATE) continue;
      const uc = row.unitCost != null ? Number(row.unitCost) : 0;
      await tx.buildExtraLine.create({
        data: {
          buildId: newBuild.id,
          extraTemplateId: row.extraTemplateId,
          name: row.name,
          description: row.description ?? "",
          quantity: row.quantity,
          unitCost: moneyDecimal(uc),
          unitSalePrice: moneyDecimal(Number(row.unitSalePrice))
        }
      });
    }

    await tx.quote.update({
      where: { id: quoteId },
      data: {
        status: QuoteStatus.ACCEPTED,
        convertedToBuildId: newBuild.id,
        convertedAt
      }
    });

    return newBuild;
  });

  const full = await getBuild(createdBuild.id);
  if (!full) {
    throw new Error("BUILD_NOT_FOUND");
  }
  return full;
}
