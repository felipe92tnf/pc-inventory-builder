import { z } from "zod";

/** z.coerce.number() convierte null en 0; null debe ir antes del coerce en el union. */
const optionalUnitSalePrice = z.preprocess(
  (val) => (val === "" ? undefined : val),
  z.union([z.null(), z.coerce.number().finite().nonnegative()]).optional()
);

export const createBuildSchema = z.object({
  name: z.string().min(1),
  notes: z.string().optional().nullable()
});

export const updateBuildSchema = createBuildSchema.partial().extend({
  saleTotalOverride: z.union([z.null(), z.coerce.number().finite().nonnegative()]).optional()
});

export const addBuildItemSchema = z.object({
  partId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  unitSalePrice: optionalUnitSalePrice
});

export const updateBuildItemSchema = z
  .object({
    quantity: z.coerce.number().int().positive().optional(),
    unitSalePrice: optionalUnitSalePrice
  })
  .refine((d) => d.quantity !== undefined || d.unitSalePrice !== undefined, {
    message: "Indica cantidad y/o precio de venta unitario (unitSalePrice)"
  });

/** Reserva 1 unidad de inventario tipo PC premontado y crea un montaje ensamblado listo para vender. */
export const fromPrebuiltPartSchema = z.object({
  partId: z.string().min(1)
});
