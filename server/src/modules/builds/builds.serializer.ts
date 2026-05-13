import type { Build, BuildExtraLine, BuildPartItem, ExtraTemplate, Part } from "@prisma/client";

function serializePart(part: Part) {
  return {
    ...part,
    costPrice: Number(part.costPrice),
    salePrice: Number(part.salePrice)
  };
}

function serializeExtraTemplateBrief(t: ExtraTemplate | null) {
  if (!t) return null;
  return {
    id: t.id,
    name: t.name,
    category: t.category,
    active: t.active,
    defaultCostPrice: Number(t.defaultCostPrice),
    defaultSalePrice: Number(t.defaultSalePrice)
  };
}

function serializeBuildExtraLine(row: BuildExtraLine & { extraTemplate: ExtraTemplate | null }) {
  return {
    id: row.id,
    buildId: row.buildId,
    extraTemplateId: row.extraTemplateId,
    name: row.name,
    description: row.description,
    quantity: row.quantity,
    unitCost: Number(row.unitCost),
    unitSalePrice: Number(row.unitSalePrice),
    extraTemplate: serializeExtraTemplateBrief(row.extraTemplate)
  };
}

/** Convierte Decimal de Prisma a number para JSON estable en todas las respuestas de montajes. */
export function serializeBuildDetail(
  build: Build & {
    items: (BuildPartItem & { part: Part })[];
    extraLines: (BuildExtraLine & { extraTemplate: ExtraTemplate | null })[];
    totalCost: number;
    computedSaleTotal: number;
    totalSale: number;
    profit: number;
  }
) {
  const { items, extraLines, ...rest } = build;
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
    })),
    extraLines: (extraLines ?? []).map((row) => serializeBuildExtraLine(row))
  };
}
