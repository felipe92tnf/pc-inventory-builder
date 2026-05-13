import express from "express";
import cors from "cors";
import { catalogRouter } from "./modules/catalog/catalog.routes.js";
import { partsRouter } from "./modules/parts/parts.routes.js";
import { buildsRouter } from "./modules/builds/builds.routes.js";
import { salesRouter } from "./modules/sales/sales.routes.js";
import { servicesRouter } from "./modules/services/services.routes.js";
import { customersRouter } from "./modules/customers/customers.routes.js";
import { quotesRouter } from "./modules/quotes/quotes.routes.js";
import { extraTemplatesRouter } from "./modules/extra-templates/extra-templates.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1/catalog", catalogRouter);
/** Alias solicitado para buscador (misma API que /catalog). */
app.use("/api/v1/catalog-parts", catalogRouter);
app.use("/api/v1/parts", partsRouter);
app.use("/api/v1/builds", buildsRouter);
app.use("/api/v1/sales", salesRouter);
app.use("/api/v1/services", servicesRouter);
app.use("/api/v1/quotes", quotesRouter);
app.use("/api/v1/extra-templates", extraTemplatesRouter);
app.use("/api/v1/customers", customersRouter);

app.use(notFoundHandler);
app.use(errorHandler);
