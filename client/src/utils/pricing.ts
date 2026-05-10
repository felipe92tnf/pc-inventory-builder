import type { PartCondition } from "../types/part";

export function calculateSalePrice(costPrice: number, condition: PartCondition): number {
  const multiplier = condition === "NEW" ? 1.18 : 1.3;
  return Math.round(costPrice * multiplier * 100) / 100;
}
