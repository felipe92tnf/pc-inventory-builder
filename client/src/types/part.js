export const PART_CATEGORIES = [
    "CPU",
    "GPU",
    "MOTHERBOARD",
    "RAM",
    "STORAGE",
    "PSU",
    "CASE",
    "COOLER",
    "FAN",
    "NETWORK",
    "MONITOR",
    "PERIPHERAL",
    "OS",
    "LABOR",
    "OTHER"
];
export const PART_CONDITIONS = ["NEW", "USED", "REFURBISHED"];
/** Categorias que no llevan stock (p. ej. licencia de SO); siempre 0 en BD y no se descuenta al vender montaje. */
export const NON_STOCK_PART_CATEGORIES = new Set(["OS", "LABOR"]);
export function isNonStockCategory(category) {
    return NON_STOCK_PART_CATEGORIES.has(category);
}
const CATEGORY_LABELS = {
    MONITOR: "Monitor",
    PERIPHERAL: "Periférico",
    OS: "Sistema Operativo",
    LABOR: "Mano de obra",
    OTHER: "Otros"
};
export function partCategoryLabel(category) {
    return CATEGORY_LABELS[category] ?? category;
}
/** Piezas OS no muestran estado en UI; en BD se guarda siempre este valor. */
export const OS_PART_CONDITION = "NEW";
export function isPartPiece(part) {
    return part.inventoryKind === "PART";
}
export function isPrebuiltPc(part) {
    return part.inventoryKind === "PREBUILT_PC";
}
export function isConfiguratorPart(part) {
    return part.inventoryKind === "PART" && part.category != null;
}
