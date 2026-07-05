function roundMoney(n) {
    return Math.round(n * 100) / 100;
}
/** Importe ya cobrado (reserva/anticipo) antes o al registrar la venta. */
export function saleAmountPaid(sale) {
    if (sale.amountPaidAtSale != null && Number.isFinite(sale.amountPaidAtSale)) {
        return Math.max(0, roundMoney(sale.amountPaidAtSale));
    }
    return 0;
}
/** Pendiente de cobro tras la venta (solo informativo). */
export function saleAmountRemaining(sale) {
    const total = roundMoney(sale.finalSalePrice);
    const paid = saleAmountPaid(sale);
    return Math.max(0, roundMoney(total - paid));
}
/** Precio total del montaje según piezas actuales (para detectar ventas mal guardadas). */
export function buildPricingTotalSale(build) {
    const n = build.totalSale ?? build.computedSaleTotal;
    if (n == null || !Number.isFinite(Number(n)))
        return null;
    return roundMoney(Number(n));
}
/**
 * Venta manual cuyo finalSalePrice parece ser solo el pendiente (bug histórico con reserva).
 */
export function saleLooksUnderstated(sale, buildTotalSale) {
    if (sale.isImported || buildTotalSale == null)
        return false;
    const stored = roundMoney(sale.finalSalePrice);
    const total = roundMoney(buildTotalSale);
    if (stored >= total - 0.02)
        return false;
    const paid = saleAmountPaid(sale);
    if (paid > 0.005 && Math.abs(stored + paid - total) < 0.03)
        return true;
    if (paid <= 0.005 && total - stored > 0.5)
        return true;
    return false;
}
