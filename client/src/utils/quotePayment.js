/** Importe total a cobrar: override manual o, si no hay, total del presupuesto. */
export function quotePaymentDueTotal(q) {
    return q.paymentTotal != null ? q.paymentTotal : q.total;
}
/** Importe pendiente (puede ser negativo si se pago de mas). */
export function quotePaymentRemaining(q) {
    return Math.round((quotePaymentDueTotal(q) - q.amountPaid) * 100) / 100;
}
