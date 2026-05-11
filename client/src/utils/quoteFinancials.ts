import type { Quote, QuoteItem } from "../types/quote";

/** Coste total de la línea (unitCost × cantidad), o null si no hay coste. */
export function itemLineCostTotal(item: QuoteItem): number | null {
  if (item.unitCost == null) return null;
  return Math.round(item.unitCost * item.quantity * 100) / 100;
}

/** Beneficio bruto de la línea (total venta − coste línea). */
export function itemLineProfit(item: QuoteItem): number | null {
  const cost = itemLineCostTotal(item);
  if (cost === null) return null;
  return Math.round((item.total - cost) * 100) / 100;
}

export type QuoteFinancialTotals = {
  /** Suma de costes de línea donde hay unitCost. */
  totalCost: number;
  /** Subtotal venta − totalCost (antes del descuento del presupuesto). */
  profitGross: number;
  /** Total cobrado al cliente − totalCost (después del descuento). */
  profitNet: number;
  /** Líneas sin coste registrado. */
  linesWithoutCost: number;
};

export function aggregateQuoteFinancials(quote: Quote): QuoteFinancialTotals {
  let totalCost = 0;
  let linesWithoutCost = 0;
  for (const item of quote.items) {
    if (item.unitCost != null) {
      totalCost += item.unitCost * item.quantity;
    } else {
      linesWithoutCost++;
    }
  }
  totalCost = Math.round(totalCost * 100) / 100;
  const profitGross = Math.round((quote.subtotal - totalCost) * 100) / 100;
  const profitNet = Math.round((quote.total - totalCost) * 100) / 100;
  return { totalCost, profitGross, profitNet, linesWithoutCost };
}

export function moneyOrDash(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "—";
  return `${value.toFixed(2)} EUR`;
}
