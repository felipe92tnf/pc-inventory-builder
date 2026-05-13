import type { Request, Response } from "express";
import { ZodError } from "zod";
import * as customersService from "./customers.service.js";
import { customerOverviewQuerySchema, patchCustomerNotesSchema } from "./customers.validators.js";

export async function getCustomerOverviewHandler(req: Request, res: Response) {
  try {
    const q = customerOverviewQuerySchema.parse({
      name: typeof req.query.name === "string" ? req.query.name : "",
      phone: typeof req.query.phone === "string" ? req.query.phone : ""
    });
    const data = await customersService.getCustomerOverview(q.name, q.phone);
    res.json(data);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: "Parametros invalidos", issues: error.flatten() });
      return;
    }
    throw error;
  }
}

export async function patchCustomerNotesHandler(req: Request, res: Response) {
  try {
    const body = patchCustomerNotesSchema.parse(req.body);
    const row = await customersService.patchCustomerNotes(body.name, body.phone, body.notes ?? null);
    res.json({
      lookupKey: row.lookupKey,
      notes: row.notes,
      updatedAt: row.updatedAt.toISOString()
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: "Validation error", issues: error.flatten() });
      return;
    }
    throw error;
  }
}
