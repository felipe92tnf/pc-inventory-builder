import type { Build, BuildPartItem, Part } from "@prisma/client";

function serializePart(part: Part) {
  return {
    ...part,
    costPrice: Number(part.costPrice),
    salePrice: Number(part.salePrice)
  };
}

/** Convierte Decimal de Prisma a number para JSON estable en todas las respuestas de montajes. */
export function serializeBuildDetail(
  build: Build & {
    items: (BuildPartItem & { part: Part })[];
    totalCost: number;
    computedSaleTotal: number;
    totalSale: number;
    profit: number;
  }
) {
  const { items, ...rest } = build;
  return {
    ...rest,
    saleTotalOverride:
      rest.saleTotalOverride === null || rest.saleTotalOverride === undefined
        ? rest.saleTotalOverride
        : Number(rest.saleTotalOverride),
    items: items.map((item) => ({
      ...item,
      unitCost: Number(item.unitCost),
      unitSalePrice: Number(item.unitSalePrice),
      part: serializePart(item.part)
    }))
  };
}
