import { z } from "zod";

const optionalTrimmed = z
  .string()
  .optional()
  .transform((v) => (v === undefined ? undefined : v.trim() === "" ? undefined : v.trim()));

const optionalCustomerId = z
  .union([z.string().min(1), z.null()])
  .optional()
  .transform((v) => (v === undefined ? undefined : v));

export const createSaleFromBuildSchema = z.object({
  customerId: optionalCustomerId,
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerEmail: z.union([z.string().email(), z.literal("")]).optional(),
  finalSalePrice: z.number().finite().nonnegative().optional(),
  paymentMethod: optionalTrimmed,
  warrantyMonths: z.number().int().nonnegative().optional(),
  notes: optionalTrimmed,
  soldAt: z.coerce.date().optional(),
  /** Si true: cobro registrado pero el PC no se cuenta como entregado hasta confirmar recogida. */
  pendingPickup: z.boolean().optional()
});

export const patchSaleSchema = z
  .object({
    customerId: optionalCustomerId,
    customerName: z.string().min(1).optional(),
    customerPhone: z.string().min(1).optional(),
    customerEmail: z.union([z.string().email(), z.literal("")]).nullable().optional(),
    finalSalePrice: z.number().finite().nonnegative().optional(),
    paymentMethod: z.union([z.string().min(1), z.null()]).optional(),
    warrantyMonths: z.number().int().nonnegative().nullable().optional(),
    notes: z.union([z.string(), z.null()]).optional(),
    soldAt: z.coerce.date().optional(),
    pickupConfirmedAt: z.coerce.date().optional().nullable()
  })
  .strict()
  .refine((body) => Object.values(body).some((v) => v !== undefined), {
    message: "At least one field is required"
  });
