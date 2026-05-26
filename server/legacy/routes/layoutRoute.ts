import { Router } from "express";

import { createLayout, deleteLayout, getLayout, listLayouts, updateLayout } from "../controllers/layoutController.js";

export const layoutRouter = Router();

layoutRouter.get("/", listLayouts);
layoutRouter.get("/:id", getLayout);
layoutRouter.post("/", createLayout);
layoutRouter.put("/:id", updateLayout);
layoutRouter.delete("/:id", deleteLayout);
