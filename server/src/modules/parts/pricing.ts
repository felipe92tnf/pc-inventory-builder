import type { PartCondition } from "@prisma/client";

function roundToInt(value: number): number {
  return Math.round(value);
}

export function calculateSalePrice(costPrice: number, condition: PartCondition): number {
  const marginMultiplier = condition === "NEW" ? 1.18 : 1.3;
  return roundToInt(costPrice * marginMultiplier);
}
