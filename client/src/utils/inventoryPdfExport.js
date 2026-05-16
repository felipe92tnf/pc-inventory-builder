import { PART_CATEGORIES, isNonStockCategory, isPrebuiltPc, partCategoryLabel } from "../types/part";
import { physicalShelfTotals } from "./physicalInventoryShelf";
/** Misma lógica que en inventario: filas que cuentan en el almacén. */
export function listedInInventoryRow(part) {
    if (part.inventoryKind === "PREBUILT_PC")
        return part.stock > 0;
    if (!part.category)
        return part.stock > 0;
    return part.stock > 0 || isNonStockCategory(part.category);
}
export const LOW_STOCK_CATEGORY_THRESHOLD = 3;
export function shelfInventoryTotals(parts) {
    const t = physicalShelfTotals(parts);
    return {
        units: t.units,
        totalCostValue: t.totalCostValue,
        totalSaleValue: t.totalSaleValue,
        potentialProfit: t.potentialProfit
    };
}
/** Base listada; mismo criterio que listados principales. */
export function getListedInventoryParts(parts) {
    return parts.filter(listedInInventoryRow);
}
export function filterPartsForInventoryPdf(listedParts, scope, category) {
    if (scope === "PREBUILT_ONLY") {
        return listedParts.filter((p) => isPrebuiltPc(p));
    }
    if (scope === "CATEGORY" && category) {
        return listedParts.filter((p) => p.inventoryKind === "PART" && p.category === category);
    }
    if (scope === "LOW_STOCK") {
        const totals = new Map();
        for (const p of listedParts) {
            if (p.inventoryKind !== "PART" || !p.category || isNonStockCategory(p.category))
                continue;
            totals.set(p.category, (totals.get(p.category) ?? 0) + p.stock);
        }
        const lowCats = new Set();
        for (const [cat, sum] of totals) {
            if (sum < LOW_STOCK_CATEGORY_THRESHOLD)
                lowCats.add(cat);
        }
        const prebuiltTotal = listedParts
            .filter((p) => isPrebuiltPc(p))
            .reduce((s, p) => s + p.stock, 0);
        const prebuiltLow = prebuiltTotal < LOW_STOCK_CATEGORY_THRESHOLD;
        return listedParts.filter((p) => {
            if (isPrebuiltPc(p))
                return prebuiltLow;
            if (p.inventoryKind !== "PART" || !p.category || isNonStockCategory(p.category))
                return false;
            return lowCats.has(p.category);
        });
    }
    return listedParts;
}
export function groupInventoryPartsForPdf(parts) {
    const byCat = new Map();
    const prebuilts = [];
    for (const p of parts) {
        if (isPrebuiltPc(p)) {
            prebuilts.push(p);
            continue;
        }
        const cat = p.category ?? "OTHER";
        const k = String(cat);
        if (!byCat.has(k))
            byCat.set(k, []);
        byCat.get(k).push(p);
    }
    const sortByName = (a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" });
    const groups = [];
    for (const cat of PART_CATEGORIES) {
        const rows = byCat.get(cat);
        if (rows?.length) {
            groups.push({
                key: cat,
                label: partCategoryLabel(cat),
                parts: [...rows].sort(sortByName)
            });
        }
    }
    if (prebuilts.length) {
        groups.push({
            key: "PREBUILT_PC",
            label: "PCs completos (premontados)",
            parts: [...prebuilts].sort(sortByName)
        });
    }
    return groups;
}
export function inventoryPdfScopeLabel(scope, category) {
    if (scope === "ALL")
        return "Inventario completo";
    if (scope === "PREBUILT_ONLY")
        return "Solo PCs completos (premontados)";
    if (scope === "LOW_STOCK")
        return `Stock bajo (categorías físicas con menos de ${LOW_STOCK_CATEGORY_THRESHOLD} uds. totales; PCs si el total es bajo)`;
    if (scope === "CATEGORY" && category)
        return `Solo categoría: ${partCategoryLabel(category)}`;
    return "Inventario (filtro personalizado)";
}
