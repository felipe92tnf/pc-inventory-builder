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
  "OS",
  "LABOR",
  "OTHER"
]);

const conditionEnum = z.enum(["NEW", "USED", "REFURBISHED"]);

const createPartPiece = z.object({
  inventoryKind: z.literal("PART"),
  name: z.string().min(1),
  category: PART_CATEGORY_ENUM,
  condition: conditionEnum,
  costPrice: z.number().nonnegative(),
  salePrice: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative(),
  notes: z.string().optional().nullable(),
  description: z.string().optional().default("")
});

const createPartPrebuilt = z.object({
  inventoryKind: z.literal("PREBUILT_PC"),
  name: z.string().min(1),
  condition: conditionEnum,
  costPrice: z.number().nonnegative(),
  salePrice: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative(),
  notes: z.string().optional().nullable(),
  description: z.string().optional().default("")
});

/** JSON.stringify elimina NaN y rompe z.number().optional(). */
function sanitizeCreatePayload(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") return payload;
  const p = { ...(payload as Record<string, unknown>) };
  if (!p.inventoryKind) {
    p.inventoryKind = "PART";
  }
  if (p.salePrice === null || (typeof p.salePrice === "number" && Number.isNaN(p.salePrice))) {
    delete p.salePrice;
  }
  if (p.costPrice === null || p.costPrice === undefined || (typeof p.costPrice === "number" && Number.isNaN(p.costPrice))) {
    p.costPrice = 0;
  }
  if (p.stock === null || p.stock === undefined || (typeof p.stock === "number" && Number.isNaN(p.stock))) {
    p.stock = 0;
  }
  return p;
}

function sanitizeUpdatePayload(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") return payload;
  const p = { ...(payload as Record<string, unknown>) };
  if (p.salePrice === null || (typeof p.salePrice === "number" && Number.isNaN(p.salePrice))) {
    delete p.salePrice;
  }
  return p;
}

export const createPartSchema = z.preprocess(
  sanitizeCreatePayload,
  z.discriminatedUnion("inventoryKind", [createPartPiece, createPartPrebuilt])
);

export const updatePartSchema = z.preprocess(
  sanitizeUpdatePayload,
  z.object({
    inventoryKind: z.enum(["PART", "PREBUILT_PC"]).optional(),
    name: z.string().min(1).optional(),
    category: PART_CATEGORY_ENUM.optional().nullable(),
    condition: conditionEnum.optional(),
    costPrice: z.number().nonnegative().optional(),
    salePrice: z.number().nonnegative().optional(),
    stock: z.number().int().nonnegative().optional(),
    notes: z.string().optional().nullable(),
    description: z.string().optional()
  })
);
