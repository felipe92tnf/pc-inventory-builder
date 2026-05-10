import type { Request, Response } from "express";
import { ZodError } from "zod";
import type { Build, BuildPartItem, Part, Sale } from "@prisma/client";
import * as salesService from "./sales.service.js";

type SaleWithUnknownBuild = Sale & { build?: unknown };

function serializePart(part: Part) {
  return {
    ...part,
    costPrice: Number(part.costPrice),
    salePrice: Number(part.salePrice)
  };
}

function serializeBuildWithItems(
  build: Build & { items: (BuildPartItem & { part: Part })[] }
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
    }))
  };
}

function serializeSale(sale: SaleWithUnknownBuild) {
  const { build, ...rest } = sale;
  const base = {
    ...rest,
    finalSalePrice: Number(sale.finalSalePrice),
    totalCost: Number(sale.totalCost),
    profit: Number(sale.profit)
  };

  if (!build || typeof build !== "object") {
    return base;
  }

  const b = build as Build & {
    saleTotalOverride?: unknown;
    items?: (BuildPartItem & { part: Part })[];
  };

  if (Array.isArray(b.items)) {
    return {
      ...base,
      build: serializeBuildWithItems(b as Build & { items: (BuildPartItem & { part: Part })[] })
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
    res.status(400).json({ message: "Solo se puede vender un montaje confirmado (assembled)." });
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
