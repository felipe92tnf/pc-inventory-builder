import type { Request, Response } from "express";
import { ZodError } from "zod";
import type { Part, Service, ServiceSparePartLine } from "@prisma/client";
import * as servicesService from "./services.service.js";

function serializePart(part: Part) {
  return {
    ...part,
    costPrice: Number(part.costPrice),
    salePrice: Number(part.salePrice)
  };
}

function serializeSparePartLine(row: ServiceSparePartLine & { part: Part }) {
  return {
    id: row.id,
    serviceId: row.serviceId,
    partId: row.partId,
    quantity: row.quantity,
    part: serializePart(row.part)
  };
}

function serializeService(
  row: Service & {
    selectedPart: Part | null;
    sparePartLines: (ServiceSparePartLine & { part: Part })[];
  }
) {
  const { sparePartLines: spareRows, selectedPart, ...rest } = row;
  const sparePartLines = spareRows ?? [];
  return {
    ...rest,
    costPrice: Number(row.costPrice),
    salePrice: Number(row.salePrice),
    profit: Number(row.profit),
    homeServiceSupplement:
      row.homeServiceSupplement === null || row.homeServiceSupplement === undefined
        ? null
        : Number(row.homeServiceSupplement),
    selectedPart: selectedPart ? serializePart(selectedPart) : null,
    sparePartLines: sparePartLines.filter((l) => l.part != null).map((l) => serializeSparePartLine(l))
  };
}

function mapServiceError(error: unknown, res: Response) {
  if (!(error instanceof Error)) {
    res.status(500).json({ message: "Unknown error" });
    return true;
  }

  const msg = error.message;
  if (msg === "SERVICE_NOT_FOUND") {
    res.status(404).json({ message: "Servicio no encontrado" });
    return true;
  }
  if (msg === "PART_NOT_FOUND") {
    res.status(404).json({ message: "Pieza no encontrada" });
    return true;
  }
  if (msg === "INSUFFICIENT_STOCK") {
    res.status(400).json({ message: "Stock insuficiente para esta operacion" });
    return true;
  }
  if (msg === "SERVICE_ALREADY_COMPLETED") {
    res.status(409).json({ message: "El servicio ya esta completado" });
    return true;
  }
  if (msg === "SERVICE_COMPLETED_STATUS_LOCKED") {
    res.status(400).json({ message: "No se puede cambiar el estado de un servicio completado" });
    return true;
  }
  if (msg === "SERVICE_COMPLETED_TYPE_LOCKED") {
    res.status(400).json({ message: "No se puede cambiar el tipo de un servicio completado" });
    return true;
  }
  if (msg === "SERVICE_COMPLETED_LINES_LOCKED") {
    res.status(400).json({
      message: "En servicios completados no se pueden cambiar las piezas vendidas; solo datos y precios."
    });
    return true;
  }
  if (msg === "SERVICE_CANCELLED") {
    res.status(400).json({ message: "No se puede completar un servicio cancelado" });
    return true;
  }
  if (msg === "SPARE_PART_INVALID") {
    res.status(400).json({ message: "Pieza y cantidad obligatorias para venta de pieza suelta" });
    return true;
  }
  if (msg === "SPARE_PART_REQUIRES_PART_KIND") {
    res.status(400).json({
      message: "La venta de pieza suelta solo admite piezas del inventario tipo componente."
    });
    return true;
  }

  return false;
}

export async function monthlySummaryHandler(_req: Request, res: Response) {
  const data = await servicesService.getMonthlyServicesSummary();
  res.json(data);
}

export async function listServicesHandler(req: Request, res: Response) {
  try {
    const rows = await servicesService.listServices(req.query as Record<string, unknown>);
    res.json(rows.map((row) => serializeService(row)));
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: "Validation error", issues: error.flatten() });
      return;
    }
    throw error;
  }
}

export async function createServiceHandler(req: Request, res: Response) {
  try {
    const row = await servicesService.createService(req.body);
    res.status(201).json(serializeService(row));
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: "Validation error", issues: error.flatten() });
      return;
    }
    if (!mapServiceError(error, res)) {
      throw error;
    }
  }
}

export async function getServiceHandler(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const row = await servicesService.getService(id);
    if (!row) {
      res.status(404).json({ message: "Servicio no encontrado" });
      return;
    }
    res.json(serializeService(row));
  } catch (error) {
    if (!mapServiceError(error, res)) {
      throw error;
    }
  }
}

export async function patchServiceHandler(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const row = await servicesService.patchService(id, req.body);
    res.json(serializeService(row));
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: "Validation error", issues: error.flatten() });
      return;
    }
    if (!mapServiceError(error, res)) {
      throw error;
    }
  }
}

export async function deleteServiceHandler(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    await servicesService.deleteService(id);
    res.status(204).send();
  } catch (error) {
    if (!mapServiceError(error, res)) {
      throw error;
    }
  }
}

export async function completeServiceHandler(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const row = await servicesService.completeService(id);
    if (!row) {
      res.status(500).json({ message: "No se pudo completar el servicio" });
      return;
    }
    res.json(serializeService(row));
  } catch (error) {
    if (!mapServiceError(error, res)) {
      throw error;
    }
  }
}
