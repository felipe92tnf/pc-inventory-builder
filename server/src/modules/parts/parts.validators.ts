import { z } from "zod";

export const createPartSchema = z.object({
  name: z.string().min(1),
  category: z.enum([
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
    "OTHER"
  ]),
  condition: z.enum(["NEW", "USED", "REFURBISHED"]),
  costPrice: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  notes: z.string().optional().nullable()
});

export const updatePartSchema = createPartSchema.partial();
