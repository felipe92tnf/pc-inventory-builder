import { Router } from "express";
import {
  addQuoteItemHandler,
  convertQuoteToBuildHandler,
  createQuoteHandler,
  deleteQuoteHandler,
  deleteQuoteItemHandler,
  getQuoteHandler,
  listQuotesHandler,
  patchQuoteHandler,
  patchQuoteItemHandler,
  patchQuoteStatusHandler
} from "./quotes.controller.js";

export const quotesRouter = Router();

quotesRouter.get("/", listQuotesHandler);
quotesRouter.post("/", createQuoteHandler);

quotesRouter.patch("/:id/status", patchQuoteStatusHandler);
quotesRouter.post("/:id/convert-to-build", convertQuoteToBuildHandler);
quotesRouter.post("/:id/items", addQuoteItemHandler);
quotesRouter.patch("/:id/items/:itemId", patchQuoteItemHandler);
quotesRouter.delete("/:id/items/:itemId", deleteQuoteItemHandler);

quotesRouter.get("/:id", getQuoteHandler);
quotesRouter.patch("/:id", patchQuoteHandler);
quotesRouter.delete("/:id", deleteQuoteHandler);
