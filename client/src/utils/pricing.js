export function calculateSalePrice(costPrice, condition) {
    const multiplier = condition === "NEW" ? 1.18 : 1.3;
    return Math.round(costPrice * multiplier * 100) / 100;
}
