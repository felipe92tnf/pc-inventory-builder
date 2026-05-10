import { Router } from "express";
import {
  addBuildItemHandler,
  confirmBuildHandler,
  createBuildHandler,
  deleteBuildHandler,
  deleteBuildItemHandler,
  getBuildHandler,
  listBuildsHandler,
  revertBuildToDraftHandler,
  updateBuildHandler,
  updateBuildItemHandler
} from "./builds.controller.js";

export const buildsRouter = Router();

buildsRouter.get("/", listBuildsHandler);
buildsRouter.get("/:id", getBuildHandler);
buildsRouter.post("/", createBuildHandler);
buildsRouter.patch("/:id", updateBuildHandler);
buildsRouter.delete("/:id", deleteBuildHandler);

buildsRouter.post("/:id/items", addBuildItemHandler);
buildsRouter.patch("/:id/items/:itemId", updateBuildItemHandler);
buildsRouter.delete("/:id/items/:itemId", deleteBuildItemHandler);

buildsRouter.post("/:id/confirm", confirmBuildHandler);
buildsRouter.post("/:id/revert-draft", revertBuildToDraftHandler);