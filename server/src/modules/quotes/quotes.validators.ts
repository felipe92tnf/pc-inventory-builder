import { QuoteItemType, QuoteStatus } from "@prisma/client";
import { z } from "zod";

const optionalTrimmed = z
  .string()
  .optional()
  .transform((v) => (v === undefined ? undefined : v.trim() === "" ? undefined : v.trim()));

const optionalNullableTrimmed = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => {
    if (v === undefined) return undefined;
    if (v === null) return null;
    const t = v.trim();
    return t === "" ? null : t;
  });

const optionalPhoneNullable = z
  .union([z.string(), z.null()])
  .optional()
  .transform((s) => {
    if (s === undefined || s === null) return null;
    const t = s.trim();
    return t === "" ? null : t;
  });

export const createQuoteSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: optionalPhoneNullable,
  customerEmail: z.union([z.string().email(), z.literal("")]).optional().nullable(),
  title: z.string().min(1),
  description: optionalNullableTrimmed,
  validUntil: z.coerce.date().optional().nullable(),
  discountAmount: z.coerce.number().finite().nonnegative().optional().default(0),
  notes: optionalNullableTrimmed,
  status: z.nativeEnum(QuoteStatus).optional()
});

export const patchQuoteSchema = z
  .object({
    customerName: z.string().min(1).optional(),
    customerPhone: z
      .union([z.string(), z.null()])
      .optional()
      .transform((v) => {
        if (v === undefined) return undefined;
        if (v === null) return null;
        const t = v.trim();
        return t === "" ? null : t;
      }),
    customerEmail: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
    title: z.string().min(1).optional(),
    description: optionalNullableTrimmed,
    validUntil: z.coerce.date().optional().nullable(),
    discountAmount: z.coerce.number().finite().nonnegative().optional(),
    notes: optionalNullableTrimmed,
    status: z.nativeEnum(QuoteStatus).optional(),
    paymentTotal: z.union([z.coerce.number().finite().nonnegative(), z.null()]).optional(),
    amountPaid: z.coerce.number().finite().nonnegative().optional(),
    paymentDate: z.coerce.date().optional().nullable()
  })
  .strict()
  .refine((body) => Object.values(body).some((v) => v !== undefined), {
    message: "At least one field is required"
  });

export const patchQuoteStatusSchema = z.object({
  status: z.nativeEnum(QuoteStatus)
});

const inventoryPartItemSchema = z.object({
  itemType: z.literal(QuoteItemType.INVENTORY_PART),
  partId: z.string().min(1),
  quantity: z.coerce.number().int().positive()
});

const manualItemSchema = z.object({
  itemType: z.literal(QuoteItemType.MANUAL_ITEM),
  name: z.string().min(1),
  description: optionalNullableTrimmed,
  quantity: z.coerce.number().int().positive(),
  unitCost: z.coerce.number().finite().nonnegative().optional().nullable(),
  unitSalePrice: z.coerce.number().finite().nonnegative()
});

const serviceItemSchema = z.object({
  itemType: z.literal(QuoteItemType.SERVICE),
  name: z.string().min(1),
  description: optionalNullableTrimmed,
  quantity: z.coerce.number().int().positive(),
  unitCost: z.coerce.number().finite().nonnegative().optional().nullable(),
  unitSalePrice: z.coerce.number().finite().nonnegative()
});

const extraTemplateQuoteItemSchema = z.object({
  itemType: z.literal(QuoteItemType.EXTRA_TEMPLATE),
  extraTemplateId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  unitCost: z.coerce.number().finite().nonnegative().optional().nullable(),
  unitSalePrice: z.coerce.number().finite().nonnegative().optional()
});

export const addQuoteItemSchema = z.discriminatedUnion("itemType", [
  inventoryPartItemSchema,
  extraTemplateQuoteItemSchema,
  manualItemSchema,
  serviceItemSchema
]);

export const patchQuoteItemSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: optionalNullableTrimmed,
    quantity: z.coerce.number().int().positive().optional(),
    unitCost: z.union([z.coerce.number().finite().nonnegative(), z.null()]).optional(),
    unitSalePrice: z.coerce.number().finite().nonnegative().optional()
  })
  .strict()
  .refine((body) => Object.values(body).some((v) => v !== undefined), {
    message: "At least one field is required"
  });
