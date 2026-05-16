import type { Request, Response } from "express";
import { ZodError } from "zod";
import * as customersService from "./customers.service.js";
import {
  createCustomerSchema,
  customerOverviewQuerySchema,
  customerSearchQuerySchema,
  patchCustomerNotesSchema,
  patchCustomerSchema
} from "./customers.validators.js";

export async function listCustomersHandler(req: Request, res: Response) {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const data = await customersService.listCustomers(q);
    res.json(data);
  } catch (error) {
    throw error;
  }
}

export async function searchCustomersHandler(req: Request, res: Response) {
  try {
    const parsed = customerSearchQuerySchema.parse({
      q: typeof req.query.q === "string" ? req.query.q : "",
      limit: req.query.limit
    });
    const data = await customersService.searchCustomers(parsed.q, parsed.limit);
    res.json(data);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: "Parametros invalidos", issues: error.flatten() });
      return;
    }
    throw error;
  }
}

export async function getCustomerByIdHandler(req: Request, res: Response) {
  const id = String(req.params.id);
  const data = await customersService.getCustomerById(id);
  if (!data) {
    res.status(404).json({ message: "Cliente no encontrado" });
    return;
  }
  res.json(data);
}

export async function createCustomerHandler(req: Request, res: Response) {
  try {
    const body = createCustomerSchema.parse(req.body);
    const data = await customersService.createCustomer(body);
    res.status(201).json(data);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: "Validation error", issues: error.flatten() });
      return;
    }
    throw error;
  }
}

export async function patchCustomerHandler(req: Request, res: Response) {
  try {
    const body = patchCustomerSchema.parse(req.body);
    const data = await customersService.patchCustomer(String(req.params.id), body);
    if (!data) {
      res.status(404).json({ message: "Cliente no encontrado" });
      return;
    }
    res.json(data);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: "Validation error", issues: error.flatten() });
      return;
    }
    if (error instanceof Error && error.message === "CUSTOMER_LOOKUP_CONFLICT") {
      res.status(409).json({ message: "Ya existe otro cliente con ese nombre y telefono." });
      return;
    }
    throw error;
  }
}

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
    res.json(row);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: "Validation error", issues: error.flatten() });
      return;
    }
    throw error;
  }
}
