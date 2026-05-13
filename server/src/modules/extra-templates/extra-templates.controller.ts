import type { Request, Response } from "express";
import { ZodError } from "zod";
import * as extraTemplatesService from "./extra-templates.service.js";

function serialize(row: {
  id: string;
  name: string;
  description: string;
  defaultCostPrice: unknown;
  defaultSalePrice: unknown;
  category: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    defaultCostPrice: Number(row.defaultCostPrice),
    defaultSalePrice: Number(row.defaultSalePrice)
  };
}

function mapError(error: unknown, res: Response): boolean {
  if (error instanceof ZodError) {
    res.status(400).json({ message: "Datos invalidos", issues: error.flatten() });
    return true;
  }
  if (error instanceof Error && error.message === "EXTRA_TEMPLATE_NOT_FOUND") {
    res.status(404).json({ message: "Plantilla no encontrada" });
    return true;
  }
  return false;
}

export async function listExtraTemplatesHandler(req: Request, res: Response) {
  try {
    const rows = await extraTemplatesService.listExtraTemplates(req.query as { activeOnly?: string });
    res.json(rows.map(serialize));
  } catch (error) {
    if (!mapError(error, res)) throw error;
  }
}

export async function createExtraTemplateHandler(req: Request, res: Response) {
  try {
    const row = await extraTemplatesService.createExtraTemplate(req.body);
    res.status(201).json(serialize(row));
  } catch (error) {
    if (!mapError(error, res)) throw error;
  }
}

export async function patchExtraTemplateHandler(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const row = await extraTemplatesService.patchExtraTemplate(id, req.body);
    res.json(serialize(row));
  } catch (error) {
    if (!mapError(error, res)) throw error;
  }
}

export async function deleteExtraTemplateHandler(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    await extraTemplatesService.deleteExtraTemplate(id);
    res.status(204).send();
  } catch (error) {
    if (!mapError(error, res)) throw error;
  }
}
