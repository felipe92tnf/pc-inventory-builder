import { z } from "zod";

export const createBuildSchema = z.object({
  name: z.string().min(1),
  notes: z.string().optional().nullable()
});

export const updateBuildSchema = createBuildSchema.partial().extend({
  saleTotalOverride: z.union([z.number().nonnegative(), z.null()]).optional()
});

export const addBuildItemSchema = z.object({
  partId: z.string().min(1),
  quantity: z.number().int().positive()
});

export const updateBuildItemSchema = z.object({
  quantity: z.number().int().positive()
});
