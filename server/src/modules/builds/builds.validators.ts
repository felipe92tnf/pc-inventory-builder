import { BuildStatus } from "@prisma/client";
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
  saleTotalOverride: z.union([z.null(), z.coerce.number().finite().nonnegative()]).optional(),
  status: z.nativeEnum(BuildStatus).optional(),
  reservationDeposit: z.union([z.null(), z.coerce.number().finite().nonnegative()]).optional(),
  reservationRemaining: z.union([z.null(), z.coerce.number().finite().nonnegative()]).optional(),
  pendingPaymentPaid: z.union([z.null(), z.coerce.number().finite().nonnegative()]).optional(),
  pendingPaymentRemaining: z.union([z.null(), z.coerce.number().finite().nonnegative()]).optional()
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

export const addBuildExtraLineSchema = z.object({
  extraTemplateId: z.string().min(1),
  quantity: z.coerce.number().int().positive().optional().default(1),
  unitCost: z.coerce.number().finite().nonnegative().optional(),
  unitSalePrice: z.coerce.number().finite().nonnegative().optional()
});

export const updateBuildExtraLineSchema = z
  .object({
    quantity: z.coerce.number().int().positive().optional(),
    unitCost: z.coerce.number().finite().nonnegative().optional(),
    unitSalePrice: z.coerce.number().finite().nonnegative().optional()
  })
  .refine((d) => d.quantity !== undefined || d.unitCost !== undefined || d.unitSalePrice !== undefined, {
    message: "Indica cantidad y/o precios"
  });
