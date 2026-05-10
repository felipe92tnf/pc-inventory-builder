import { Router } from "express";
import {
  completeServiceHandler,
  createServiceHandler,
  deleteServiceHandler,
  getServiceHandler,
  listServicesHandler,
  monthlySummaryHandler,
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
