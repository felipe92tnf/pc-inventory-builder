import type { Part } from "../types/part";
import { isNonStockCategory } from "../types/part";

/**
 * Línea de `Part` que cuenta en el valor del almacén físico (resumen inventario).
 * No incluye plantillas/ extras SO-LABOR ni líneas sin unidades disponibles.
 * (No hay campo «archivado» en `Part`; si se añade en BD, filtrar aquí.)
 */
export function isPhysicalShelfLine(part: Part): boolean {
  const q = part.stock;
  if (!Number.isFinite(q) || q <= 0) return false;
  if (part.inventoryKind === "PREBUILT_PC") return true;
  if (part.inventoryKind !== "PART") return false;
  if (part.category != null && isNonStockCategory(part.category)) return false;
  return true;
}

export type PhysicalShelfTotals = {
  totalCostValue: number;
  totalSaleValue: number;
  potentialProfit: number;
  /** Suma de unidades en stock (solo líneas incluidas). */
  units: number;
  /** Número de filas `Part` que entraron en el cálculo. */
  includedLineCount: number;
};

export function physicalShelfTotals(parts: Part[]): PhysicalShelfTotals {
  let totalCostValue = 0;
  let totalSaleValue = 0;
  let units = 0;
  let includedLineCount = 0;
  for (const p of parts) {
    if (!isPhysicalShelfLine(p)) continue;
    includedLineCount++;
    const c = Number(p.costPrice);
    const s = Number(p.salePrice);
    const q = p.stock;
    if (!Number.isFinite(c) || !Number.isFinite(s) || !Number.isFinite(q)) continue;
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

/** Estadísticas para depuración (no usar en UI de producción). */
export type PhysicalInventoryDebugStats = {
  /** Líneas físicas incluidas en coste/venta/beneficio/unidades. */
  includedPhysicalLines: number;
  /** Suma de stock incluido. */
  unitsSummed: number;
  /** Filas con stock <= 0 o stock no numérico. */
  excludedZeroOrNegativeStock: number;
  /** Piezas PART categoría SO/LABOR (extras/servicios sin stock físico). */
  excludedNonStockCategoryLines: number;
  /** Enlace a plantilla catálogo y sin stock (no suman al almacén). */
  excludedCatalogLinkedZeroStock: number;
};

export function computePhysicalInventoryDebugStats(parts: Part[]): PhysicalInventoryDebugStats {
  const shelf = physicalShelfTotals(parts);
  let excludedZeroOrNegativeStock = 0;
  let excludedNonStockCategoryLines = 0;
  let excludedCatalogLinkedZeroStock = 0;

  for (const p of parts) {
    const q = p.stock;
    const zeroOrBad = !Number.isFinite(q) || q <= 0;
    if (zeroOrBad) {
      excludedZeroOrNegativeStock++;
      if (p.catalogPartId) excludedCatalogLinkedZeroStock++;
    }
    if (
      p.inventoryKind === "PART" &&
      p.category != null &&
      isNonStockCategory(p.category)
    ) {
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
