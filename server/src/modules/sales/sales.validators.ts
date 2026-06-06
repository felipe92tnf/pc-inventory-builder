import { z } from "zod";

const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

const optionalTrimmed = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === null) return undefined;
    const t = v.trim();
    return t === "" ? undefined : t;
  });

const optionalCustomerId = z
  .union([z.string().min(1), z.null()])
  .optional()
  .transform((v) => (v === undefined ? undefined : v));

const optionalNonNegativeNumber = z.preprocess(
  emptyToUndefined,
  z
    .union([z.number().finite().nonnegative(), z.string()])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      if (typeof v === "number") return v;
      const n = Number(String(v).trim().replace(",", "."));
      return n;
    })
    .refine((v) => v === undefined || (Number.isFinite(v) && v >= 0), {
      message: "Debe ser un numero mayor o igual a 0"
    })
);

const optionalNonNegativeInt = z.preprocess(
  emptyToUndefined,
  z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      if (typeof v === "number") return Math.trunc(v);
      const n = Number(String(v).trim());
      return Number.isFinite(n) ? Math.trunc(n) : NaN;
    })
    .refine((v) => v === undefined || (Number.isInteger(v) && v >= 0), {
      message: "Debe ser un entero mayor o igual a 0"
    })
);

export const createSaleFromBuildSchema = z
  .object({
    customerId: optionalCustomerId,
    customerName: optionalTrimmed,
    customerPhone: optionalTrimmed,
    customerEmail: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
    finalSalePrice: optionalNonNegativeNumber,
    salePrice: optionalNonNegativeNumber,
    price: optionalNonNegativeNumber,
    paymentMethod: optionalTrimmed,
    warrantyMonths: optionalNonNegativeInt,
    notes: optionalTrimmed,
    soldAt: z.coerce.date().optional(),
    /** Si true: cobro registrado pero el PC no se cuenta como entregado hasta confirmar recogida. */
    pendingPickup: z.boolean().optional()
  })
  .transform((data) => ({
    ...data,
    finalSalePrice: data.finalSalePrice ?? data.salePrice ?? data.price
  }));

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
