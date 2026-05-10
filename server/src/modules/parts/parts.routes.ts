import { Router } from "express";
import {
  createPartHandler,
  deletePartHandler,
  getPartHandler,
  listPartsHandler,
  updatePartHandler
} from "./parts.controller.js";

export const partsRouter = Router();

partsRouter.get("/", listPartsHandler);
partsRouter.get("/:id", getPartHandler);
partsRouter.post("/", createPartHandler);
partsRouter.patch("/:id", updatePartHandler);
partsRouter.delete("/:id", deletePartHandler);
