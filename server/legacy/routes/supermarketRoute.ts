import { Router } from "express";

import { getSupermarketLayout, listSupermarkets } from "../controllers/supermarketController.js";

export const supermarketRouter = Router();

supermarketRouter.get("/", listSupermarkets);
supermarketRouter.get("/:id", getSupermarketLayout);
