import type { Request, Response } from "express";
import { ZodError, type ZodIssue } from "zod";
import * as partsService from "./parts.service.js";

function mapPartError(error: unknown, res: Response): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  if (error.message === "PART_IN_USE") {
    res.status(400).json({
      message: "No se puede eliminar esta pieza porque está asociada a un montaje."
    });
    return true;
  }

  return false;
}

export async function listPartsHandler(_req: Request, res: Response) {
  const data = await partsService.listParts();
  res.json(data);
}

export async function getPartHandler(req: Request, res: Response) {
  const partId = String(req.params.id);
  const data = await partsService.getPart(partId);

  if (!data) {
    res.status(404).json({ message: "Part not found" });
    return;
  }

  res.json(data);
}

export async function createPartHandler(req: Request, res: Response) {
  try {
    const data = await partsService.createPart(req.body);
    res.status(201).json(data);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        message: error.issues.map((issue: ZodIssue) => issue.message).join("; ")
      });
      return;
    }
    throw error;
  }
}

export async function updatePartHandler(req: Request, res: Response) {
  try {
    const partId = String(req.params.id);
    const data = await partsService.updatePart(partId, req.body);
    res.json(data);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        message: error.issues.map((issue: ZodIssue) => issue.message).join("; ")
      });
      return;
    }
    throw error;
  }
}

export async function deletePartHandler(req: Request, res: Response) {
  try {
    const partId = String(req.params.id);
    await partsService.deletePart(partId);
    res.status(204).send();
  } catch (error) {
    if (!mapPartError(error, res)) {
      throw error;
    }
  }
}
