/** Coste total de la línea (unitCost × cantidad), o null si no hay coste. */
export function itemLineCostTotal(item) {
    if (item.unitCost == null)
        return null;
    return Math.round(item.unitCost * item.quantity * 100) / 100;
}
/** Beneficio bruto de la línea (total venta − coste línea). */
export function itemLineProfit(item) {
    const cost = itemLineCostTotal(item);
    if (cost === null)
        return null;
    return Math.round((item.total - cost) * 100) / 100;
}
export function aggregateQuoteFinancials(quote) {
    let totalCost = 0;
    let linesWithoutCost = 0;
    for (const item of quote.items) {
        if (item.unitCost != null) {
            totalCost += item.unitCost * item.quantity;
        }
        else {
            linesWithoutCost++;
        }
    }
    totalCost = Math.round(totalCost * 100) / 100;
    const profitGross = Math.round((quote.subtotal - totalCost) * 100) / 100;
    const profitNet = Math.round((quote.total - totalCost) * 100) / 100;
    return { totalCost, profitGross, profitNet, linesWithoutCost };
}
export function moneyOrDash(value) {
    if (value === null || Number.isNaN(value))
        return "—";
    return `${value.toFixed(2)} EUR`;
}
