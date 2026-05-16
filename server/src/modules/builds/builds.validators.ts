import { BuildStatus } from "@prisma/client";
import { z } from "zod";

/** z.coerce.number() convierte null en 0; null debe ir antes del coerce en el union. */
const optionalUnitSalePrice = z.preprocess(
  (val) => (val === "" ? undefined : val),
  z.union([z.null(), z.coerce.number().finite().nonnegative()]).optional()
);

const optionalCustomerNullable = z
  .union([z.string(), z.null()])
  .optional()
  .transform((val) => {
    if (val === undefined) return undefined;
    if (val === null) return null;
    const t = val.trim();
    return t.length ? t : null;
  })
  .refine((v) => v === undefined || v === null || v.length <= 200, { message: "Maximo 200 caracteres" });

const optionalCustomerEmailNullable = optionalCustomerNullable.superRefine((val, ctx) => {
  if (val === undefined || val === null) return;
  const parsed = z.string().email().safeParse(val);
  if (!parsed.success) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Email no valido" });
  }
});

const optionalCustomerId = z
  .union([z.string().min(1), z.null()])
  .optional()
  .transform((v) => (v === undefined ? undefined : v));

export const createBuildSchema = z.object({
  name: z.string().min(1),
  notes: z.string().optional().nullable(),
  customerId: optionalCustomerId,
  customerName: optionalCustomerNullable,
  customerPhone: optionalCustomerNullable,
  customerEmail: optionalCustomerEmailNullable
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

/** Pieza/concepto fuera de inventario (sin plantilla ni stock). */
export const addBuildManualLineSchema = z.object({
  name: z.string().min(1, "Indica el nombre"),
  description: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null) return "";
      return v.trim();
    }),
  quantity: z.coerce.number().int().positive().optional().default(1),
  unitCost: z.coerce.number().finite().nonnegative(),
  unitSalePrice: z.coerce.number().finite().nonnegative()
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

const CONFIRM_INITIAL_STATUSES = new Set<BuildStatus>([
  BuildStatus.CONFIRMED,
  BuildStatus.RESERVED,
  BuildStatus.PENDING_PAYMENT
]);

/** Opciones al confirmar montaje (descuento de stock + estado operativo inicial). */
export const confirmBuildSchema = z
  .object({
    initialStatus: z.nativeEnum(BuildStatus).optional(),
    reservationDeposit: z.coerce.number().finite().nonnegative().optional(),
    reservationRemaining: z.coerce.number().finite().nonnegative().optional(),
    pendingPaymentPaid: z.coerce.number().finite().nonnegative().optional(),
    pendingPaymentRemaining: z.coerce.number().finite().nonnegative().optional()
  })
  .superRefine((data, ctx) => {
    const st = data.initialStatus ?? BuildStatus.CONFIRMED;
    if (data.initialStatus !== undefined && !CONFIRM_INITIAL_STATUSES.has(st)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Solo se admite Listo para la venta, Reservado o Pendiente de pago como estado inicial.",
        path: ["initialStatus"]
      });
      return;
    }
    if (st === BuildStatus.RESERVED) {
      if (data.reservationDeposit === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indica la reserva ya cobrada (EUR).",
          path: ["reservationDeposit"]
        });
      }
      if (data.reservationRemaining === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indica el importe restante (EUR).",
          path: ["reservationRemaining"]
        });
      }
    }
    if (st === BuildStatus.PENDING_PAYMENT) {
      if (data.pendingPaymentPaid === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indica el importe ya cobrado (EUR).",
          path: ["pendingPaymentPaid"]
        });
      }
      if (data.pendingPaymentRemaining === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indica el importe pendiente (EUR).",
          path: ["pendingPaymentRemaining"]
        });
      }
    }
  });
