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
