import type { PartCondition } from "../types/part";

export function calculateSalePrice(costPrice: number, condition: PartCondition): number {
  const multiplier = condition === "NEW" ? 1.18 : 1.3;
  // Evita precios "feos" (p. ej. 34.97) en el modo automatico.
  return Math.round(costPrice * multiplier);
}
