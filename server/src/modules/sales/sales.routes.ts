import { Router } from "express";
import {
  createSaleFromBuildHandler,
  deleteSaleHandler,
  getSaleHandler,
  listSalesHandler,
  monthlySummaryHandler,
  patchSaleHandler
} from "./sales.controller.js";

export const salesRouter = Router();

salesRouter.get("/summary/monthly", monthlySummaryHandler);
salesRouter.post("/from-build/:buildId", createSaleFromBuildHandler);
salesRouter.get("/", listSalesHandler);
salesRouter.get("/:id", getSaleHandler);
salesRouter.patch("/:id", patchSaleHandler);
salesRouter.delete("/:id", deleteSaleHandler);
