import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { createExtraTemplateSchema, patchExtraTemplateSchema } from "./extra-templates.validators.js";

function moneyDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(Math.round(value * 100) / 100);
}

export async function listExtraTemplates(query: { activeOnly?: string }) {
  const activeOnly = query.activeOnly === "1" || query.activeOnly === "true";
  return prisma.extraTemplate.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: [{ category: "asc" }, { name: "asc" }]
  });
}

export async function getExtraTemplate(id: string) {
  return prisma.extraTemplate.findUnique({ where: { id } });
}

export async function createExtraTemplate(payload: unknown) {
  const data = createExtraTemplateSchema.parse(payload);
  return prisma.extraTemplate.create({
    data: {
      name: data.name.trim(),
      description: (data.description ?? "").trim(),
      defaultCostPrice: moneyDecimal(data.defaultCostPrice),
      defaultSalePrice: moneyDecimal(data.defaultSalePrice),
      category: (data.category ?? "").trim(),
      active: data.active ?? true
    }
  });
}

export async function patchExtraTemplate(id: string, payload: unknown) {
  const data = patchExtraTemplateSchema.parse(payload);
  const patch: Prisma.ExtraTemplateUpdateInput = {};
  if (data.name !== undefined) patch.name = data.name.trim();
  if (data.description !== undefined) patch.description = (data.description ?? "").trim();
  if (data.defaultCostPrice !== undefined) patch.defaultCostPrice = moneyDecimal(data.defaultCostPrice);
  if (data.defaultSalePrice !== undefined) patch.defaultSalePrice = moneyDecimal(data.defaultSalePrice);
  if (data.category !== undefined) patch.category = (data.category ?? "").trim();
  if (data.active !== undefined) patch.active = data.active;

  const existing = await prisma.extraTemplate.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("EXTRA_TEMPLATE_NOT_FOUND");
  }

  return prisma.extraTemplate.update({ where: { id }, data: patch });
}

export async function deleteExtraTemplate(id: string) {
  const existing = await prisma.extraTemplate.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("EXTRA_TEMPLATE_NOT_FOUND");
  }
  await prisma.extraTemplate.delete({ where: { id } });
}
