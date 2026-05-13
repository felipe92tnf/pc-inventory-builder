import type { Request, Response } from "express";
import { ZodError } from "zod";
import * as buildsService from "./builds.service.js";
import { serializeBuildDetail } from "./builds.serializer.js";

function mapValidationOrBuildError(error: unknown, res: Response): boolean {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Datos invalidos",
      issues: error.flatten()
    });
    return true;
  }
  return mapBuildError(error, res);
}

function mapBuildError(error: unknown, res: Response) {
  if (!(error instanceof Error)) {
    res.status(500).json({ message: "Unknown error" });
    return true;
  }

  if (error.message === "BUILD_NOT_FOUND") {
    res.status(404).json({ message: "Build not found" });
    return true;
  }

  if (error.message === "PART_NOT_FOUND") {
    res.status(404).json({ message: "Pieza no encontrada" });
    return true;
  }

  if (error.message === "BUILD_ITEM_REQUIRES_PART_KIND") {
    res.status(400).json({
      message: "Solo las piezas sueltas pueden anadirse a un montaje por componentes."
    });
    return true;
  }

  if (error.message === "INVALID_PREBUILT_PART") {
    res.status(400).json({
      message: "Solo se pueden usar PCs completos del inventario (tipo premontado)."
    });
    return true;
  }

  if (error.message === "BUILD_ALREADY_CONFIRMED") {
    res.status(409).json({ message: "Build already confirmed" });
    return true;
  }

  if (error.message === "BUILD_NOT_EDITABLE") {
    res.status(409).json({
      message: "Solo se pueden editar piezas en montajes en borrador."
    });
    return true;
  }

  if (error.message === "BUILD_NOT_DRAFT") {
    res.status(409).json({
      message: "Solo se puede confirmar un montaje que este en borrador."
    });
    return true;
  }

  if (error.message === "BUILD_IS_SOLD") {
    res.status(409).json({
      message:
        "Este montaje esta vendido: elimina primero la venta asociada o no se puede modificar."
    });
    return true;
  }

  if (error.message === "BUILD_HAS_SALE") {
    res.status(409).json({
      message: "Hay una venta asociada a este montaje. Elimina la venta antes de borrar el montaje o volver a borrador."
    });
    return true;
  }

  if (error.message === "BUILD_STATUS_PATCH_FORBIDDEN") {
    res.status(400).json({ message: "No se puede fijar ese estado por esta ruta." });
    return true;
  }

  if (error.message === "BUILD_STATUS_USE_CONFIRM") {
    res.status(400).json({ message: "Confirma el montaje primero; el estado solo se cambia en montajes ensamblados." });
    return true;
  }

  if (error.message === "BUILD_STATUS_INVALID") {
    res.status(400).json({ message: "Estado de montaje no valido." });
    return true;
  }

  if (error.message === "BUILD_PENDING_PICKUP_NEEDS_SALE") {
    res.status(400).json({
      message: "Pendiente de recogida requiere una venta registrada (marca pendiente de recogida al cobrar)."
    });
    return true;
  }

  if (error.message === "BUILD_ALREADY_DELIVERED") {
    res.status(409).json({ message: "La recogida de esta venta ya esta confirmada." });
    return true;
  }

  if (error.message === "BUILD_HAS_PENDING_PICKUP_SALE") {
    res.status(409).json({
      message: "Hay una venta pendiente de recogida. Confirma la entrega o elimina la venta antes de cambiar el estado."
    });
    return true;
  }

  if (error.message === "BUILD_NOT_CONFIRMED") {
    res.status(400).json({ message: "El montaje no esta confirmado; solo se puede revertir un montaje ensamblado." });
    return true;
  }

  if (error.message === "BUILD_EMPTY") {
    res.status(400).json({ message: "Build has no items" });
    return true;
  }

  if (error.message === "EXTRA_TEMPLATE_NOT_FOUND") {
    res.status(404).json({ message: "Plantilla de extra no encontrada" });
    return true;
  }

  if (error.message === "EXTRA_TEMPLATE_INACTIVE") {
    res.status(400).json({ message: "La plantilla de extra esta desactivada" });
    return true;
  }

  if (error.message === "BUILD_EXTRA_LINE_NOT_FOUND") {
    res.status(404).json({ message: "Linea de extra no encontrada en este montaje" });
    return true;
  }

  if (error.message.startsWith("INSUFFICIENT_STOCK:")) {
    const partName = error.message.split(":")[1];
    res.status(409).json({ message: `Insufficient stock for part: ${partName}` });
    return true;
  }

  return false;
}

export async function listBuildsHandler(_req: Request, res: Response) {
  const data = await buildsService.listBuilds();
  res.json(data.map((b) => serializeBuildDetail(b)));
}

export async function getBuildHandler(req: Request, res: Response) {
  const buildId = String(req.params.id);
  const data = await buildsService.getBuild(buildId);

  if (!data) {
    res.status(404).json({ message: "Build not found" });
    return;
  }

  res.json(serializeBuildDetail(data));
}

export async function createBuildHandler(req: Request, res: Response) {
  try {
    const data = await buildsService.createBuild(req.body);
    res.status(201).json(data);
  } catch (error) {
    if (!mapValidationOrBuildError(error, res)) {
      throw error;
    }
  }
}

export async function createBuildFromPrebuiltHandler(req: Request, res: Response) {
  try {
    const data = await buildsService.createBuildFromPrebuiltPart(req.body);
    if (!data) {
      res.status(404).json({ message: "Build not found" });
      return;
    }
    res.status(201).json(serializeBuildDetail(data));
  } catch (error) {
    if (!mapValidationOrBuildError(error, res)) {
      throw error;
    }
  }
}

export async function updateBuildHandler(req: Request, res: Response) {
  try {
    const buildId = String(req.params.id);
    await buildsService.updateBuild(buildId, req.body);
    const data = await buildsService.getBuild(buildId);
    if (!data) {
      res.status(404).json({ message: "Build not found" });
      return;
    }
    res.json(serializeBuildDetail(data));
  } catch (error) {
    if (!mapValidationOrBuildError(error, res)) {
      throw error;
    }
  }
}

export async function deleteBuildHandler(req: Request, res: Response) {
  try {
    const buildId = String(req.params.id);
    await buildsService.deleteBuild(buildId);
    res.status(204).send();
  } catch (error) {
    if (!mapBuildError(error, res)) {
      throw error;
    }
  }
}

export async function addBuildItemHandler(req: Request, res: Response) {
  try {
    const buildId = String(req.params.id);
    await buildsService.addBuildItem(buildId, req.body);
    const build = await buildsService.getBuild(buildId);
    if (!build) {
      res.status(404).json({ message: "Build not found" });
      return;
    }
    res.status(201).json(serializeBuildDetail(build));
  } catch (error) {
    if (!mapValidationOrBuildError(error, res)) {
      throw error;
    }
  }
}

export async function updateBuildItemHandler(req: Request, res: Response) {
  try {
    const buildId = String(req.params.id);
    const itemId = String(req.params.itemId);
    await buildsService.updateBuildItem(buildId, itemId, req.body);
    const build = await buildsService.getBuild(buildId);
    if (!build) {
      res.status(404).json({ message: "Build not found" });
      return;
    }
    res.json(serializeBuildDetail(build));
  } catch (error) {
    if (!mapValidationOrBuildError(error, res)) {
      throw error;
    }
  }
}

export async function deleteBuildItemHandler(req: Request, res: Response) {
  try {
    const buildId = String(req.params.id);
    const itemId = String(req.params.itemId);
    await buildsService.deleteBuildItem(buildId, itemId);
    res.status(204).send();
  } catch (error) {
    if (!mapBuildError(error, res)) {
      throw error;
    }
  }
}

export async function addBuildExtraLineHandler(req: Request, res: Response) {
  try {
    const buildId = String(req.params.id);
    await buildsService.addBuildExtraLine(buildId, req.body);
    const build = await buildsService.getBuild(buildId);
    if (!build) {
      res.status(404).json({ message: "Build not found" });
      return;
    }
    res.status(201).json(serializeBuildDetail(build));
  } catch (error) {
    if (!mapValidationOrBuildError(error, res)) {
      throw error;
    }
  }
}

export async function updateBuildExtraLineHandler(req: Request, res: Response) {
  try {
    const buildId = String(req.params.id);
    const lineId = String(req.params.lineId);
    await buildsService.updateBuildExtraLine(buildId, lineId, req.body);
    const build = await buildsService.getBuild(buildId);
    if (!build) {
      res.status(404).json({ message: "Build not found" });
      return;
    }
    res.json(serializeBuildDetail(build));
  } catch (error) {
    if (!mapValidationOrBuildError(error, res)) {
      throw error;
    }
  }
}

export async function deleteBuildExtraLineHandler(req: Request, res: Response) {
  try {
    const buildId = String(req.params.id);
    const lineId = String(req.params.lineId);
    await buildsService.deleteBuildExtraLine(buildId, lineId);
    res.status(204).send();
  } catch (error) {
    if (!mapBuildError(error, res)) {
      throw error;
    }
  }
}

export async function confirmBuildHandler(req: Request, res: Response) {
  try {
    const buildId = String(req.params.id);
    const data = await buildsService.confirmBuild(buildId);
    if (!data) {
      res.status(404).json({ message: "Build not found" });
      return;
    }
    res.json(serializeBuildDetail(data));
  } catch (error) {
    if (!mapBuildError(error, res)) {
      throw error;
    }
  }
}

export async function revertBuildToDraftHandler(req: Request, res: Response) {
  try {
    const buildId = String(req.params.id);
    const data = await buildsService.revertBuildToDraft(buildId);
    if (!data) {
      res.status(404).json({ message: "Build not found" });
      return;
    }
    res.json(serializeBuildDetail(data));
  } catch (error) {
    if (!mapBuildError(error, res)) {
      throw error;
    }
  }
}
