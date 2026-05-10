import type { Prisma } from "@prisma/client";
import { InventoryKind, PartCategory, PartCondition } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { createPartSchema, updatePartSchema } from "./parts.validators.js";
import { calculateSalePrice } from "./pricing.js";

function isNonStockPartCategory(category: PartCategory): boolean {
  return category === PartCategory.OS || category === PartCategory.LABOR;
}

export async function listParts() {
  return prisma.part.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getPart(id: string) {
  return prisma.part.findUnique({ where: { id } });
}

export async function createPart(payload: unknown) {
  const data = createPartSchema.parse(payload);

  if (data.inventoryKind === "PREBUILT_PC") {
    const salePrice =
      data.salePrice !== undefined
        ? data.salePrice
        : calculateSalePrice(data.costPrice, data.condition);
    return prisma.part.create({
      data: {
        inventoryKind: InventoryKind.PREBUILT_PC,
        name: data.name,
        category: null,
        condition: data.condition,
        costPrice: data.costPrice,
        salePrice,
        stock: data.stock,
        notes: data.notes ?? null,
        description: data.description ?? ""
      }
    });
  }

  const salePrice =
    data.salePrice !== undefined ? data.salePrice : calculateSalePrice(data.costPrice, data.condition);
  const stock = isNonStockPartCategory(data.category) ? 0 : data.stock;

  return prisma.part.create({
    data: {
      inventoryKind: InventoryKind.PART,
      name: data.name,
      category: data.category,
      condition: isNonStockPartCategory(data.category) ? PartCondition.NEW : data.condition,
      costPrice: data.costPrice,
      salePrice,
      stock,
      notes: data.notes ?? null,
      description: data.description ?? ""
    }
  });
}

export async function updatePart(id: string, payload: unknown) {
  const data = updatePartSchema.parse(payload);
  const existingPart = await prisma.part.findUnique({ where: { id } });

  if (!existingPart) {
    throw new Error("PART_NOT_FOUND");
  }

  if (existingPart.inventoryKind === InventoryKind.PREBUILT_PC) {
    const nextCost = data.costPrice ?? Number(existingPart.costPrice);
    const nextCond = (data.condition ?? existingPart.condition) as PartCondition;
    let salePriceToSet: number | undefined;

    if (data.salePrice !== undefined) {
      salePriceToSet = data.salePrice;
    } else if (data.costPrice !== undefined || data.condition !== undefined) {
      salePriceToSet = calculateSalePrice(nextCost, nextCond);
    }

    return prisma.part.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.condition !== undefined ? { condition: data.condition } : {}),
        ...(data.costPrice !== undefined ? { costPrice: data.costPrice } : {}),
        ...(data.stock !== undefined ? { stock: data.stock } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(salePriceToSet !== undefined ? { salePrice: salePriceToSet } : {})
      }
    });
  }

  const incomingSale = data.salePrice;
  const costInPatch = data.costPrice;
  const conditionInPatch = data.condition;

  let salePriceToSet: number | undefined;

  if (incomingSale !== undefined) {
    salePriceToSet = incomingSale;
  } else if (existingPart && (costInPatch !== undefined || conditionInPatch !== undefined)) {
    const mergedCatForSale = (data.category ?? existingPart.category) as PartCategory;
    const nextCondition = isNonStockPartCategory(mergedCatForSale)
      ? PartCondition.NEW
      : (conditionInPatch ?? existingPart.condition);
    const nextCostPrice = costInPatch ?? Number(existingPart.costPrice);
    salePriceToSet = calculateSalePrice(nextCostPrice, nextCondition);
  }

  const mergedCategory = (data.category ?? existingPart.category) as PartCategory | undefined;
  const forceStockZero = mergedCategory !== undefined && isNonStockPartCategory(mergedCategory);

  const patch: Prisma.PartUpdateInput = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.category !== undefined) patch.category = data.category;
  if (data.condition !== undefined) patch.condition = data.condition;
  if (data.costPrice !== undefined) patch.costPrice = data.costPrice;
  if (data.notes !== undefined) patch.notes = data.notes;
  if (data.description !== undefined) patch.description = data.description;

  if (forceStockZero) {
    patch.stock = 0;
  } else if (data.stock !== undefined) {
    patch.stock = data.stock;
  }

  if (mergedCategory !== undefined && isNonStockPartCategory(mergedCategory)) {
    patch.condition = PartCondition.NEW;
  }

  if (salePriceToSet !== undefined) {
    patch.salePrice = salePriceToSet;
  }

  return prisma.part.update({
    where: { id },
    data: patch
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
