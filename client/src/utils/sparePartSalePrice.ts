import type { Part } from "../types/part";
import type { SpareLineDraft } from "../components/services/ServiceSparePartsSection";

export function computeSpareSalePriceFromInventory(
  lines: SpareLineDraft[],
  parts: Part[]
): number | "" {
  let total = 0;
  let any = false;
  for (const line of lines) {
    if (!line.partId || line.quantity < 1) continue;
    const part = parts.find((p) => p.id === line.partId);
    if (!part) continue;
    const unitSale = Number(part.salePrice);
    if (!Number.isFinite(unitSale) || unitSale < 0) continue;
    any = true;
    total += unitSale * line.quantity;
  }
  return any ? Math.round(total * 100) / 100 : "";
}
