import type { Request, Response } from "express";
import { ZodError } from "zod";
import type { ExtraTemplate, Part, Service, ServiceExtraLine, ServiceSparePartLine } from "@prisma/client";
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

function serializeExtraTemplateBrief(t: ExtraTemplate | null) {
  if (!t) return null;
  return {
    id: t.id,
    name: t.name,
    category: t.category,
    active: t.active,
    defaultCostPrice: Number(t.defaultCostPrice),
    defaultSalePrice: Number(t.defaultSalePrice)
  };
}

function serializeServiceExtraLine(row: ServiceExtraLine & { extraTemplate: ExtraTemplate | null }) {
  return {
    id: row.id,
    serviceId: row.serviceId,
    extraTemplateId: row.extraTemplateId,
    name: row.name,
    description: row.description,
    quantity: row.quantity,
    unitCost: Number(row.unitCost),
    unitSalePrice: Number(row.unitSalePrice),
    extraTemplate: serializeExtraTemplateBrief(row.extraTemplate)
  };
}

function serializeService(
  row: Service & {
    selectedPart: Part | null;
    sparePartLines: (ServiceSparePartLine & { part: Part })[];
    extraLines: (ServiceExtraLine & { extraTemplate: ExtraTemplate | null })[];
  }
) {
  const { sparePartLines: spareRows, selectedPart, extraLines: extraRows, ...rest } = row;
  const sparePartLines = spareRows ?? [];
  const extraLines = extraRows ?? [];
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
    sparePartLines: sparePartLines.filter((l) => l.part != null).map((l) => serializeSparePartLine(l)),
    extraLines: extraLines.map((l) => serializeServiceExtraLine(l))
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
    res.status(400).json({ message: "No hay stock suficiente" });
    return true;
  }
  if (msg === "SERVICE_ALREADY_COMPLETED") {
    res.status(409).json({ message: "El servicio ya esta completado" });
    return true;
  }
  if (msg === "SERVICE_NOT_ACTIVE_FOR_REVERT") {
    res.status(400).json({ message: "Solo se puede revertir un servicio completado" });
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
      message: "En servicios completados no se pueden cambiar piezas, precios ni conceptos."
    });
    return true;
  }
  if (msg === "USE_COMPLETE_ENDPOINT") {
    res.status(400).json({
      message: "Para marcar como completado usa el boton Completar, no cambiar el estado manualmente."
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

  if (msg === "EXTRA_TEMPLATE_NOT_FOUND") {
    res.status(404).json({ message: "Plantilla de extra no encontrada" });
    return true;
  }

  if (msg === "EXTRA_TEMPLATE_INACTIVE") {
    res.status(400).json({ message: "La plantilla de extra esta desactivada" });
    return true;
  }

  if (msg === "SERVICE_EXTRA_LINE_NOT_FOUND") {
    res.status(404).json({ message: "Linea de extra no encontrada en este servicio" });
    return true;
  }

  return false;
}

function zodValidationMessage(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) {
    return "Datos invalidos";
  }
  const path = issue.path.join(".");
  if (path.includes("salePrice")) {
    return "Debes indicar precio de venta";
  }
  if (path.includes("sparePartLines") || path.includes("partId")) {
    return "Debes seleccionar una pieza";
  }
  if (path.includes("manualLines")) {
    return "Añade al menos un concepto de servicio";
  }
  return issue.message;
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
      res.status(400).json({ message: zodValidationMessage(error), issues: error.flatten() });
      return;
    }
    throw error;
  }
}

export async function createServiceHandler(req: Request, res: Response) {
  try {
    const row = await servicesService.createService(req.body);
    if (!row) {
      res.status(500).json({ message: "No se pudo crear el servicio" });
      return;
    }
    res.status(201).json(serializeService(row));
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: zodValidationMessage(error), issues: error.flatten() });
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
      res.status(400).json({ message: zodValidationMessage(error), issues: error.flatten() });
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

export async function revertServiceHandler(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const row = await servicesService.revertService(id);
    if (!row) {
      res.status(500).json({ message: "No se pudo revertir el servicio" });
      return;
    }
    res.json(serializeService(row));
  } catch (error) {
    if (!mapServiceError(error, res)) {
      throw error;
    }
  }
}

export async function addServiceExtraLineHandler(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const row = await servicesService.addServiceExtraLine(id, req.body);
    if (!row) {
      res.status(500).json({ message: "No se pudo anadir la linea" });
      return;
    }
    res.status(201).json(serializeService(row));
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: zodValidationMessage(error), issues: error.flatten() });
      return;
    }
    if (!mapServiceError(error, res)) {
      throw error;
    }
  }
}

export async function patchServiceExtraLineHandler(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const lineId = String(req.params.lineId);
    const row = await servicesService.patchServiceExtraLine(id, lineId, req.body);
    if (!row) {
      res.status(500).json({ message: "No se pudo actualizar la linea" });
      return;
    }
    res.json(serializeService(row));
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: zodValidationMessage(error), issues: error.flatten() });
      return;
    }
    if (!mapServiceError(error, res)) {
      throw error;
    }
  }
}

export async function deleteServiceExtraLineHandler(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const lineId = String(req.params.lineId);
    const row = await servicesService.deleteServiceExtraLine(id, lineId);
    if (!row) {
      res.status(500).json({ message: "No se pudo actualizar el servicio" });
      return;
    }
    res.json(serializeService(row));
  } catch (error) {
    if (!mapServiceError(error, res)) {
      throw error;
    }
  }
}
