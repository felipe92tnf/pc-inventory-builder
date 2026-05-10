import { prisma } from "../../db/prisma.js";
import { createPartSchema, updatePartSchema } from "./parts.validators.js";
import { calculateSalePrice } from "./pricing.js";

export async function listParts() {
  return prisma.part.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getPart(id: string) {
  return prisma.part.findUnique({ where: { id } });
}

export async function createPart(payload: unknown) {
  const data = createPartSchema.parse(payload);
  return prisma.part.create({
    data: {
      ...data,
      salePrice: calculateSalePrice(data.costPrice, data.condition)
    }
  });
}

export async function updatePart(id: string, payload: unknown) {
  const data = updatePartSchema.parse(payload);
  const shouldRecalculatePrice = data.condition !== undefined || data.costPrice !== undefined;

  if (!shouldRecalculatePrice) {
    return prisma.part.update({ where: { id }, data });
  }

  const existingPart = await prisma.part.findUnique({ where: { id } });

  if (!existingPart) {
    return prisma.part.update({ where: { id }, data });
  }

  const nextCondition = data.condition ?? existingPart.condition;
  const nextCostPrice = data.costPrice ?? Number(existingPart.costPrice);

  return prisma.part.update({
    where: { id },
    data: {
      ...data,
      ...(shouldRecalculatePrice ? { salePrice: calculateSalePrice(nextCostPrice, nextCondition) } : {})
    }
  });
}

export async function deletePart(id: string) {
  const relatedBuildItemsCount = await prisma.buildPartItem.count({
    where: { partId: id }
  });

  if (relatedBuildItemsCount > 0) {
    throw new Error("PART_IN_USE");
  }

  return prisma.part.delete({ where: { id } });
}
