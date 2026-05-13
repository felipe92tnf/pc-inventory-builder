import type { PartCondition } from "../types/part";

/** Margen sobre coste: nuevo +15%; usado y reacondicionado +30%. */
export function calculateSalePrice(costPrice: number, condition: PartCondition): number {
  const multiplier = condition === "NEW" ? 1.15 : 1.3;
  // Evita precios "feos" (p. ej. 34.97) en el modo automatico.
  return Math.round(costPrice * multiplier);
}
