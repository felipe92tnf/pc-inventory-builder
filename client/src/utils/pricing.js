export function calculateSalePrice(costPrice, condition) {
    const multiplier = condition === "NEW" ? 1.15 : 1.3;
    // Evita precios "feos" (p. ej. 34.97) en el modo automatico.
    return Math.round(costPrice * multiplier);
}
