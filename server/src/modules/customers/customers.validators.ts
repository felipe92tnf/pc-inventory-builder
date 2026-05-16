import { z } from "zod";

export const customerOverviewQuerySchema = z.object({
  name: z.string().min(1, "Indica el nombre"),
  phone: z.string().optional().default("")
});

export const patchCustomerNotesSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().default(""),
  notes: z.string().nullable().optional()
});

export const customerSearchQuerySchema = z.object({
  q: z.string().optional().default(""),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12)
});

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Indica el nombre"),
  phone: z.string().optional().default(""),
  email: z
    .union([z.string().email(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  notes: z.string().nullable().optional()
});

export const patchCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z
    .union([z.string().email(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" ? null : v)),
  notes: z.string().nullable().optional()
});

const optionalCustomerId = z
  .union([z.string().min(1), z.null()])
  .optional()
  .transform((v) => (v === undefined ? undefined : v));

export const customerIdFieldSchema = optionalCustomerId;
