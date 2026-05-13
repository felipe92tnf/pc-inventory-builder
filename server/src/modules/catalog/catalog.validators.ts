import { z } from "zod";

const PART_CATEGORY_ENUM = z.enum([
  "CPU",
  "GPU",
  "MOTHERBOARD",
  "RAM",
  "STORAGE",
  "PSU",
  "CASE",
  "COOLER",
  "FAN",
  "NETWORK",
  "MONITOR",
  "PERIPHERAL",
  "OS",
  "LABOR",
  "OTHER"
]);

function emptyToNullSku(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") return payload;
  const p = { ...(payload as Record<string, unknown>) };
  if (p.sku === "") p.sku = null;
  return p;
}

export const createCatalogPartSchema = z.preprocess(
  emptyToNullSku,
  z.object({
    sku: z.string().min(1).nullable().optional(),
    name: z.string().min(1),
    category: PART_CATEGORY_ENUM,
    brand: z.string().optional().default(""),
    model: z.string().optional().default(""),
    defaultCostPrice: z.number().nonnegative(),
    defaultSalePrice: z.number().nonnegative(),
    notes: z.string().optional().nullable()
  })
);
