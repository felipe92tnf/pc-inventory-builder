import express from "express";
import cors from "cors";
import { partsRouter } from "./modules/parts/parts.routes.js";
import { buildsRouter } from "./modules/builds/builds.routes.js";
import { salesRouter } from "./modules/sales/sales.routes.js";
import { servicesRouter } from "./modules/services/services.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1/parts", partsRouter);
app.use("/api/v1/builds", buildsRouter);
app.use("/api/v1/sales", salesRouter);
app.use("/api/v1/services", servicesRouter);

app.use(notFoundHandler);
app.use(errorHandler);
