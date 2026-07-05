export function computeSpareSalePriceFromInventory(lines, parts) {
    let total = 0;
    let any = false;
    for (const line of lines) {
        if (!line.partId || line.quantity < 1)
            continue;
        const part = parts.find((p) => p.id === line.partId);
        if (!part)
            continue;
        const unitSale = Number(part.salePrice);
        if (!Number.isFinite(unitSale) || unitSale < 0)
            continue;
        any = true;
        total += unitSale * line.quantity;
    }
    return any ? Math.round(total * 100) / 100 : "";
}
