import type { Request, Response } from "express";
import multer from "multer";
import { z, ZodError } from "zod";
import type { Build, BuildExtraLine, BuildPartItem, ExtraTemplate, Part, Sale } from "@prisma/client";
import * as salesService from "./sales.service.js";
import * as salesImportService from "./sales.import.service.js";
import * as salesImportRevert from "./sales.import.revert.service.js";

const uploadSalesImport = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

type SaleWithUnknownBuild = Sale & { build?: unknown };

function serializePart(part: Part) {
  return {
    ...part,
    costPrice: Number(part.costPrice),
    salePrice: Number(part.salePrice)
  };
}

function serializeBuildWithItems(
  build: Build & {
    items: (BuildPartItem & { part: Part })[];
    extraLines?: (BuildExtraLine & { extraTemplate: ExtraTemplate | null })[];
  }
) {
  return {
    ...build,
    saleTotalOverride:
      build.saleTotalOverride === null || build.saleTotalOverride === undefined
        ? build.saleTotalOverride
        : Number(build.saleTotalOverride),
    items: build.items.map((item) => ({
      ...item,
      unitCost: Number(item.unitCost),
      unitSalePrice: Number(item.unitSalePrice),
      part: serializePart(item.part)
    })),
    extraLines: (build.extraLines ?? []).map((row) => ({
      id: row.id,
      buildId: row.buildId,
      extraTemplateId: row.extraTemplateId,
      name: row.name,
      description: row.description,
      quantity: row.quantity,
      unitCost: Number(row.unitCost),
      unitSalePrice: Number(row.unitSalePrice),
      extraTemplate: row.extraTemplate
        ? {
            id: row.extraTemplate.id,
            name: row.extraTemplate.name,
            category: row.extraTemplate.category,
            active: row.extraTemplate.active,
            defaultCostPrice: Number(row.extraTemplate.defaultCostPrice),
            defaultSalePrice: Number(row.extraTemplate.defaultSalePrice)
          }
        : null
    }))
  };
}

function serializeSale(sale: SaleWithUnknownBuild) {
  const { build, ...rest } = sale;
  const base = {
    ...rest,
    finalSalePrice: Number(sale.finalSalePrice),
    totalCost: Number(sale.totalCost),
    profit: Number(sale.profit),
    importedAt:
      sale.importedAt instanceof Date ? sale.importedAt.toISOString() : (sale.importedAt as string | null | undefined)
  };

  if (!build || typeof build !== "object") {
    return base;
  }

  const b = build as Build & {
    saleTotalOverride?: unknown;
    items?: (BuildPartItem & { part: Part })[];
    extraLines?: (BuildExtraLine & { extraTemplate: ExtraTemplate | null })[];
  };

  if (Array.isArray(b.items)) {
    return {
      ...base,
      build: serializeBuildWithItems(
        b as Build & {
          items: (BuildPartItem & { part: Part })[];
          extraLines?: (BuildExtraLine & { extraTemplate: ExtraTemplate | null })[];
        }
      )
    };
  }

  return {
    ...base,
    build: {
      ...b,
      saleTotalOverride:
        b.saleTotalOverride === null || b.saleTotalOverride === undefined
          ? b.saleTotalOverride
          : Number(b.saleTotalOverride)
    }
  };
}

function mapSaleError(error: unknown, res: Response) {
  if (!(error instanceof Error)) {
    res.status(500).json({ message: "Unknown error" });
    return true;
  }

  if (error.message === "BUILD_NOT_FOUND") {
    res.status(404).json({ message: "Build not found" });
    return true;
  }
  if (error.message === "BUILD_NOT_ASSEMBLED") {
    res.status(400).json({
      message: "Solo se puede vender un montaje listo (confirmado, reserva o pendiente de pago)."
    });
    return true;
  }
  if (error.message === "BUILD_ALREADY_PENDING_PICKUP") {
    res.status(409).json({
      message: "Este montaje ya tiene una venta pendiente de recogida. Confirma la recogida o anula la venta."
    });
    return true;
  }
  if (error.message === "BUILD_ALREADY_SOLD") {
    res.status(409).json({ message: "Este montaje ya tiene una venta registrada." });
    return true;
  }
  if (error.message === "SALE_NOT_FOUND") {
    res.status(404).json({ message: "Sale not found" });
    return true;
  }

  return false;
}

export async function monthlySummaryHandler(_req: Request, res: Response) {
  const data = await salesService.getMonthlySalesSummary();
  res.json(data);
}

export async function listSalesImportBatchesHandler(_req: Request, res: Response) {
  const batches = await salesImportRevert.listSalesImportBatches();
  res.json({ batches });
}

export async function previewSalesImportBatchHandler(req: Request, res: Response) {
  try {
    const batchId = String(req.params.batchId);
    const preview = await salesImportRevert.previewSalesImportBatchRevert(batchId);
    res.json(preview);
  } catch (error) {
    if (error instanceof Error && error.message === "IMPORT_BATCH_NOT_FOUND") {
      res.status(404).json({ message: "No existe ese lote de importación o ya fue revertido." });
      return;
    }
    throw error;
  }
}

const revertImportBodySchema = z.object({
  confirmPhrase: z.string()
});

export async function revertSalesImportBatchHandler(req: Request, res: Response) {
  try {
    const batchId = String(req.params.batchId);
    const parsed = revertImportBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Falta confirmPhrase (string) en el cuerpo JSON." });
      return;
    }
    const result = await salesImportRevert.revertSalesImportBatch(batchId, parsed.data.confirmPhrase);
    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "IMPORT_BATCH_NOT_FOUND") {
        res.status(404).json({ message: "No existe ese lote de importación o ya fue revertido." });
        return;
      }
      if (error.message === "CONFIRMATION_MISMATCH") {
        res.status(400).json({
          message: `Frase de confirmación incorrecta. Escribe exactamente: ${salesImportRevert.REVERT_IMPORT_CONFIRM_PHRASE}`
        });
        return;
      }
    }
    throw error;
  }
}

export async function salesImportPreviewHandler(req: Request, res: Response) {
  try {
    const file = req.file;
    if (!file?.buffer) {
      res.status(400).json({ message: "Falta el archivo (campo multipart file)." });
      return;
    }
    if (!/\.(xlsx|xls|csv)$/i.test(file.originalname)) {
      res.status(400).json({ message: "Solo se permiten archivos .xlsx, .xls o .csv." });
      return;
    }
    const rows = salesImportService.buildSalesImportPreview(file.buffer, file.originalname);
    res.json({ rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo leer el archivo.";
    res.status(400).json({ message });
  }
}

export async function salesImportConfirmHandler(req: Request, res: Response) {
  try {
    const result = await salesImportService.importSalesConfirm(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: "Datos de importación inválidos.", issues: error.flatten() });
      return;
    }
    const message = error instanceof Error ? error.message : "Error al importar.";
    res.status(400).json({ message });
  }
}

export async function createSaleFromBuildHandler(req: Request, res: Response) {
  try {
    const buildId = String(req.params.buildId);
    const data = await salesService.createSaleFromBuild(buildId, req.body);
    if (!data) {
      res.status(500).json({ message: "Sale creation failed" });
      return;
    }
    res.status(201).json(serializeSale(data));
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: "Validation error", issues: error.flatten() });
      return;
    }
    if (!mapSaleError(error, res)) {
      throw error;
    }
  }
}

export async function listSalesHandler(_req: Request, res: Response) {
  const rows = await salesService.listSales();
  res.json(rows.map((row) => serializeSale(row)));
}

export async function getSaleHandler(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const data = await salesService.getSale(id);
    if (!data) {
      res.status(404).json({ message: "Sale not found" });
      return;
    }
    res.json(serializeSale(data));
  } catch (error) {
    if (!mapSaleError(error, res)) {
      throw error;
    }
  }
}

export async function patchSaleHandler(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const data = await salesService.patchSale(id, req.body);
    if (!data) {
      res.status(404).json({ message: "Sale not found" });
      return;
    }
    res.json(serializeSale(data));
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: "Validation error", issues: error.flatten() });
      return;
    }
    if (!mapSaleError(error, res)) {
      throw error;
    }
  }
}

export async function deleteSaleHandler(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    await salesService.deleteSale(id);
    res.status(204).send();
  } catch (error) {
    if (!mapSaleError(error, res)) {
      throw error;
    }
  }
}

export { uploadSalesImport };
