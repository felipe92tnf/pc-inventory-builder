import type { Request, Response } from "express";
import { ZodError, type ZodIssue } from "zod";
import { serializeBuildDetail } from "../builds/builds.serializer.js";
import * as quotesService from "./quotes.service.js";
import { serializeQuote } from "./quotes.serializer.js";

function mapQuoteError(error: unknown, res: Response): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  if (error.message === "QUOTE_NOT_FOUND") {
    res.status(404).json({ message: "Presupuesto no encontrado" });
    return true;
  }

  if (error.message === "QUOTE_ITEM_NOT_FOUND") {
    res.status(404).json({ message: "Linea de presupuesto no encontrada" });
    return true;
  }

  if (error.message === "PART_NOT_FOUND") {
    res.status(404).json({ message: "Pieza no encontrada" });
    return true;
  }

  if (error.message === "QUOTE_ALREADY_CONVERTED") {
    res.status(409).json({ message: "Este presupuesto ya fue convertido en un montaje." });
    return true;
  }

  if (error.message === "BUILD_NOT_FOUND") {
    res.status(500).json({ message: "Montaje creado pero no se pudo cargar." });
    return true;
  }

  return false;
}

function zodMessage(error: ZodError): string {
  return error.issues.map((issue: ZodIssue) => issue.message).join("; ");
}

export async function listQuotesHandler(_req: Request, res: Response) {
  const rows = await quotesService.listQuotes();
  res.json(rows.map((row) => serializeQuote(row)));
}

export async function getQuoteHandler(req: Request, res: Response) {
  const id = String(req.params.id);
  const row = await quotesService.getQuote(id);

  if (!row) {
    res.status(404).json({ message: "Presupuesto no encontrado" });
    return;
  }

  res.json(serializeQuote(row));
}

export async function createQuoteHandler(req: Request, res: Response) {
  try {
    const row = await quotesService.createQuote(req.body);
    res.status(201).json(serializeQuote(row));
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: zodMessage(error) });
      return;
    }
    throw error;
  }
}

export async function patchQuoteHandler(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const row = await quotesService.patchQuote(id, req.body);
    if (!row) {
      res.status(404).json({ message: "Presupuesto no encontrado" });
      return;
    }
    res.json(serializeQuote(row));
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: zodMessage(error) });
      return;
    }
    if (!mapQuoteError(error, res)) {
      throw error;
    }
  }
}

export async function deleteQuoteHandler(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    await quotesService.deleteQuote(id);
    res.status(204).send();
  } catch (error) {
    if (!mapQuoteError(error, res)) {
      throw error;
    }
  }
}

export async function patchQuoteStatusHandler(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const row = await quotesService.patchQuoteStatus(id, req.body);
    if (!row) {
      res.status(404).json({ message: "Presupuesto no encontrado" });
      return;
    }
    res.json(serializeQuote(row));
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: zodMessage(error) });
      return;
    }
    if (!mapQuoteError(error, res)) {
      throw error;
    }
  }
}

export async function addQuoteItemHandler(req: Request, res: Response) {
  try {
    const quoteId = String(req.params.id);
    const row = await quotesService.addQuoteItem(quoteId, req.body);
    if (!row) {
      res.status(404).json({ message: "Presupuesto no encontrado" });
      return;
    }
    res.status(201).json(serializeQuote(row));
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: zodMessage(error) });
      return;
    }
    if (!mapQuoteError(error, res)) {
      throw error;
    }
  }
}

export async function patchQuoteItemHandler(req: Request, res: Response) {
  try {
    const quoteId = String(req.params.id);
    const itemId = String(req.params.itemId);
    const row = await quotesService.patchQuoteItem(quoteId, itemId, req.body);
    if (!row) {
      res.status(404).json({ message: "Presupuesto no encontrado" });
      return;
    }
    res.json(serializeQuote(row));
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: zodMessage(error) });
      return;
    }
    if (!mapQuoteError(error, res)) {
      throw error;
    }
  }
}

export async function convertQuoteToBuildHandler(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const build = await quotesService.convertQuoteToBuild(id);
    res.status(201).json(serializeBuildDetail(build));
  } catch (error) {
    if (!mapQuoteError(error, res)) {
      throw error;
    }
  }
}

export async function deleteQuoteItemHandler(req: Request, res: Response) {
  try {
    const quoteId = String(req.params.id);
    const itemId = String(req.params.itemId);
    const row = await quotesService.deleteQuoteItem(quoteId, itemId);
    if (!row) {
      res.status(404).json({ message: "Presupuesto no encontrado" });
      return;
    }
    res.json(serializeQuote(row));
  } catch (error) {
    if (!mapQuoteError(error, res)) {
      throw error;
    }
  }
}
