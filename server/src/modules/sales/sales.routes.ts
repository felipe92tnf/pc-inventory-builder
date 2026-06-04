import { Router } from "express";
import {
  createSaleFromBuildHandler,
  deleteSaleHandler,
  getSaleHandler,
  listSalesHandler,
  listSalesImportBatchesHandler,
  monthlySummaryHandler,
  patchSaleHandler,
  previewSalesImportBatchHandler,
  recalculateSaleFromBuildHandler,
  revertSaleHandler,
  revertSalesImportBatchHandler,
  salesImportConfirmHandler,
  salesImportPreviewHandler,
  uploadSalesImport
} from "./sales.controller.js";

export const salesRouter = Router();

salesRouter.get("/summary/monthly", monthlySummaryHandler);
salesRouter.get("/import-batches", listSalesImportBatchesHandler);
salesRouter.get("/import-batches/:batchId/preview", previewSalesImportBatchHandler);
salesRouter.post("/import-batches/:batchId/revert", revertSalesImportBatchHandler);
salesRouter.post("/import-preview", uploadSalesImport.single("file"), salesImportPreviewHandler);
salesRouter.post("/import-confirm", salesImportConfirmHandler);
salesRouter.post("/from-build/:buildId", createSaleFromBuildHandler);
salesRouter.get("/", listSalesHandler);
salesRouter.get("/:id", getSaleHandler);
salesRouter.patch("/:id", patchSaleHandler);
salesRouter.post("/:id/revert", revertSaleHandler);
salesRouter.post("/:id/recalculate-from-build", recalculateSaleFromBuildHandler);
salesRouter.delete("/:id", deleteSaleHandler);
