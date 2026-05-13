import { Router } from "express";
import { getCustomerOverviewHandler, patchCustomerNotesHandler } from "./customers.controller.js";

export const customersRouter = Router();

customersRouter.get("/overview", getCustomerOverviewHandler);
customersRouter.patch("/notes", patchCustomerNotesHandler);
