import { Router } from "express";
import {
  createExtraTemplateHandler,
  deleteExtraTemplateHandler,
  listExtraTemplatesHandler,
  patchExtraTemplateHandler
} from "./extra-templates.controller.js";

export const extraTemplatesRouter = Router();

extraTemplatesRouter.get("/", listExtraTemplatesHandler);
extraTemplatesRouter.post("/", createExtraTemplateHandler);
extraTemplatesRouter.patch("/:id", patchExtraTemplateHandler);
extraTemplatesRouter.delete("/:id", deleteExtraTemplateHandler);
