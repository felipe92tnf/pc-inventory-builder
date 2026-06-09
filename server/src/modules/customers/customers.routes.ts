import { Router } from "express";
import {
  createCustomerHandler,
  deleteCustomerHandler,
  getCustomerByIdHandler,
  getCustomerOverviewHandler,
  listCustomersHandler,
  patchCustomerHandler,
  patchCustomerNotesHandler,
  searchCustomersHandler
} from "./customers.controller.js";

export const customersRouter = Router();

customersRouter.get("/", listCustomersHandler);
customersRouter.get("/search", searchCustomersHandler);
customersRouter.get("/overview", getCustomerOverviewHandler);
customersRouter.patch("/notes", patchCustomerNotesHandler);
customersRouter.get("/:id", getCustomerByIdHandler);
customersRouter.post("/", createCustomerHandler);
customersRouter.patch("/:id", patchCustomerHandler);
customersRouter.delete("/:id", deleteCustomerHandler);
