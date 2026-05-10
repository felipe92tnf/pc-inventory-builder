import type { PartCondition } from "@prisma/client";

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateSalePrice(costPrice: number, condition: PartCondition): number {
  const marginMultiplier = condition === "NEW" ? 1.18 : 1.3;
  return roundToTwo(costPrice * marginMultiplier);
}
