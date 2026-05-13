import { Router } from "express";
import { createCatalogPartHandler, listCatalogHandler } from "./catalog.controller.js";

export const catalogRouter = Router();

catalogRouter.get("/", listCatalogHandler);
catalogRouter.post("/", createCatalogPartHandler);
