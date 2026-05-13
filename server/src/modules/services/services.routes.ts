import { Router } from "express";
import {
  addServiceExtraLineHandler,
  completeServiceHandler,
  createServiceHandler,
  deleteServiceExtraLineHandler,
  deleteServiceHandler,
  getServiceHandler,
  listServicesHandler,
  monthlySummaryHandler,
  patchServiceExtraLineHandler,
  patchServiceHandler
} from "./services.controller.js";

export const servicesRouter = Router();

servicesRouter.get("/summary/monthly", monthlySummaryHandler);
servicesRouter.post("/", createServiceHandler);
servicesRouter.get("/", listServicesHandler);
servicesRouter.get("/:id", getServiceHandler);
servicesRouter.patch("/:id", patchServiceHandler);
servicesRouter.delete("/:id", deleteServiceHandler);
servicesRouter.post("/:id/complete", completeServiceHandler);
servicesRouter.post("/:id/extra-lines", addServiceExtraLineHandler);
servicesRouter.patch("/:id/extra-lines/:lineId", patchServiceExtraLineHandler);
servicesRouter.delete("/:id/extra-lines/:lineId", deleteServiceExtraLineHandler);
