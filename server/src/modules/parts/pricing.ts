import type { PartCondition } from "@prisma/client";

function roundToInt(value: number): number {
  return Math.round(value);
}

/** Margen sobre coste: nuevo +15%; usado y reacondicionado +30%. */
export function calculateSalePrice(costPrice: number, condition: PartCondition): number {
  const marginMultiplier = condition === "NEW" ? 1.15 : 1.3;
  return roundToInt(costPrice * marginMultiplier);
}
