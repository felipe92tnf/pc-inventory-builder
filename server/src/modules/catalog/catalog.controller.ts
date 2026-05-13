import type { Request, Response } from "express";
import { ZodError, type ZodIssue } from "zod";
import * as catalogService from "./catalog.service.js";

/** Acepta `search` o `q`; cadena vacía = listar todo (sin filtro). */
function parseCatalogSearch(req: Request): string | undefined {
  const raw =
    typeof req.query.search === "string"
      ? req.query.search
      : typeof req.query.q === "string"
        ? req.query.q
        : undefined;
  const t = raw?.trim() ?? "";
  return t.length === 0 ? undefined : t;
}

export async function listCatalogHandler(req: Request, res: Response) {
  const effective = parseCatalogSearch(req);

  // DEBUG temporal SecondByte — quitar cuando el flujo esté estable
  console.log(
    "[SecondByte catalog] GET list search=%s path=%s",
    JSON.stringify(effective ?? ""),
    req.originalUrl
  );

  const data = await catalogService.listCatalog(effective);

  console.log("[SecondByte catalog] query efectiva=%s resultados=%d", JSON.stringify(effective ?? ""), data.length);
  if (data.length > 0) {
    console.log(
      "[SecondByte catalog] muestra primeros IDs:",
      data.slice(0, 5).map((row) => ({ id: row.id, name: row.name, sku: row.sku }))
    );
  } else {
    console.log("[SecondByte catalog] array devuelto vacío []");
  }

  res.json(data);
}

export async function createCatalogPartHandler(req: Request, res: Response) {
  try {
    const data = await catalogService.createCatalogPart(req.body);

    console.log("[SecondByte catalog] POST PartCatalog creado id=%s name=%s", data.id, data.name);

    res.status(201).json(data);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        message: error.issues.map((issue: ZodIssue) => issue.message).join("; ")
      });
      return;
    }
    if (error instanceof Error) {
      if (error.message === "CATALOG_SKU_EXISTS") {
        res.status(409).json({ message: "Ya existe una pieza en el catalogo con ese SKU." });
        return;
      }
      if (error.message === "CATALOG_DUPLICATE_TRIPLE") {
        res.status(409).json({
          message: "Ya existe una entrada con el mismo nombre, marca y modelo en el catalogo."
        });
        return;
      }
    }
    throw error;
  }
}
