import { Router } from "express";

import { getIndoorGraph, getOptimizedRoute, getPreviewRoute, postSnapPosition } from "../controllers/navigationController.js";

export const navigationRouter = Router();

navigationRouter.get("/graph/:supermarketId", getIndoorGraph);
navigationRouter.post("/snap", postSnapPosition);
navigationRouter.post("/preview", getPreviewRoute);
navigationRouter.post("/optimize", getOptimizedRoute);
