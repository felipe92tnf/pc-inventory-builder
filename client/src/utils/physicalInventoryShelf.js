import { isNonStockCategory } from "../types/part";
/**
 * Línea de `Part` que cuenta en el valor del almacén físico (resumen inventario).
 * No incluye plantillas/ extras SO-LABOR ni líneas sin unidades disponibles.
 * (No hay campo «archivado» en `Part`; si se añade en BD, filtrar aquí.)
 */
export function isPhysicalShelfLine(part) {
    const q = part.stock;
    if (!Number.isFinite(q) || q <= 0)
        return false;
    if (part.inventoryKind === "PREBUILT_PC")
        return true;
    if (part.inventoryKind !== "PART")
        return false;
    if (part.category != null && isNonStockCategory(part.category))
        return false;
    return true;
}
export function physicalShelfTotals(parts) {
    let totalCostValue = 0;
    let totalSaleValue = 0;
    let units = 0;
    let includedLineCount = 0;
    for (const p of parts) {
        if (!isPhysicalShelfLine(p))
            continue;
        includedLineCount++;
        const c = Number(p.costPrice);
        const s = Number(p.salePrice);
        const q = p.stock;
        if (!Number.isFinite(c) || !Number.isFinite(s) || !Number.isFinite(q))
            continue;
        totalCostValue += c * q;
        totalSaleValue += s * q;
        units += q;
    }
    return {
        totalCostValue,
        totalSaleValue,
        potentialProfit: totalSaleValue - totalCostValue,
        units,
        includedLineCount
    };
}
export function computePhysicalInventoryDebugStats(parts) {
    const shelf = physicalShelfTotals(parts);
    let excludedZeroOrNegativeStock = 0;
    let excludedNonStockCategoryLines = 0;
    let excludedCatalogLinkedZeroStock = 0;
    for (const p of parts) {
        const q = p.stock;
        const zeroOrBad = !Number.isFinite(q) || q <= 0;
        if (zeroOrBad) {
            excludedZeroOrNegativeStock++;
            if (p.catalogPartId)
                excludedCatalogLinkedZeroStock++;
        }
        if (p.inventoryKind === "PART" &&
            p.category != null &&
            isNonStockCategory(p.category)) {
            excludedNonStockCategoryLines++;
        }
    }
    return {
        includedPhysicalLines: shelf.includedLineCount,
        unitsSummed: shelf.units,
        excludedZeroOrNegativeStock,
        excludedNonStockCategoryLines,
        excludedCatalogLinkedZeroStock
    };
}
