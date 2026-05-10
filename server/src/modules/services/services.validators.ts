import { ServiceStatus, ServiceType } from "@prisma/client";
import { z } from "zod";

export const createServiceSchema = z
  .object({
    type: z.nativeEnum(ServiceType),
    title: z.string().min(1),
    customerName: z.string().min(1),
    customerPhone: z.string().min(1),
    customerEmail: z.union([z.string().email(), z.literal("")]).optional().nullable(),
    description: z.string().optional().default(""),
    selectedPartId: z.string().optional().nullable(),
    quantity: z.number().int().positive().optional().nullable(),
    costPrice: z.number().nonnegative().optional(),
    salePrice: z.number().nonnegative().optional(),
    isHomeService: z.boolean().optional().default(false),
    homeServiceAddress: z.string().optional().nullable(),
    homeServiceSupplement: z.number().nonnegative().optional().nullable(),
    serviceDate: z.coerce.date(),
    paymentMethod: z.string().optional().nullable(),
    notes: z.string().optional().nullable()
  })
  .superRefine((data, ctx) => {
    if (data.type === ServiceType.SPARE_PART_SALE) {
      if (!data.selectedPartId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecciona una pieza del inventario",
          path: ["selectedPartId"]
        });
      }
      if (data.quantity === undefined || data.quantity === null || data.quantity < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indica la cantidad",
          path: ["quantity"]
        });
      }
      if (data.salePrice === undefined || data.salePrice === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indica el precio de venta",
          path: ["salePrice"]
        });
      }
    } else {
      if (data.costPrice === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Precio de coste requerido",
          path: ["costPrice"]
        });
      }
      if (data.salePrice === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Precio de venta requerido",
          path: ["salePrice"]
        });
      }
    }
  });

export const patchServiceSchema = z
  .object({
    type: z.nativeEnum(ServiceType).optional(),
    title: z.string().min(1).optional(),
    customerName: z.string().min(1).optional(),
    customerPhone: z.string().min(1).optional(),
    customerEmail: z.union([z.string().email(), z.literal("")]).optional().nullable(),
    description: z.string().optional(),
    selectedPartId: z.string().optional().nullable(),
    quantity: z.number().int().positive().optional().nullable(),
    costPrice: z.number().nonnegative().optional(),
    salePrice: z.number().nonnegative().optional(),
    profit: z.number().optional(),
    isHomeService: z.boolean().optional(),
    homeServiceAddress: z.string().optional().nullable(),
    homeServiceSupplement: z.number().nonnegative().optional().nullable(),
    serviceDate: z.coerce.date().optional(),
    status: z.nativeEnum(ServiceStatus).optional(),
    paymentMethod: z.string().optional().nullable(),
    notes: z.string().optional().nullable()
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.status === ServiceStatus.COMPLETED) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Para marcar como completado usa POST /services/:id/complete",
        path: ["status"]
      });
    }
  });

export const listServicesQuerySchema = z
  .object({
    type: z.nativeEnum(ServiceType).optional(),
    status: z.nativeEnum(ServiceStatus).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional()
  })
  .superRefine((q, ctx) => {
    const hasM = q.month !== undefined;
    const hasY = q.year !== undefined;
    if (hasM !== hasY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indica mes y año juntos",
        path: ["month"]
      });
    }
  });
