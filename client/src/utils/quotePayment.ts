import type { Quote } from "../types/quote";

/** Importe total a cobrar: override manual o, si no hay, total del presupuesto. */
export function quotePaymentDueTotal(q: Pick<Quote, "total" | "paymentTotal">): number {
  return q.paymentTotal != null ? q.paymentTotal : q.total;
}

/** Importe pendiente (puede ser negativo si se pago de mas). */
export function quotePaymentRemaining(q: Pick<Quote, "total" | "paymentTotal" | "amountPaid">): number {
  return Math.round((quotePaymentDueTotal(q) - q.amountPaid) * 100) / 100;
}
