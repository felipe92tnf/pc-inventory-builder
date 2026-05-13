import { z } from "zod";

export const createExtraTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  defaultCostPrice: z.coerce.number().finite().nonnegative(),
  defaultSalePrice: z.coerce.number().finite().nonnegative(),
  category: z.string().optional().nullable(),
  active: z.boolean().optional()
});

export const patchExtraTemplateSchema = createExtraTemplateSchema.partial().refine(
  (body) => Object.keys(body).length > 0,
  { message: "Al menos un campo" }
);
