import { Router } from "express";

import { createShelf, deleteShelf, getShelf, listShelves, updateShelf } from "../controllers/shelfController.js";

export const shelfRouter = Router();

shelfRouter.get("/", listShelves);
shelfRouter.get("/:id", getShelf);
shelfRouter.post("/", createShelf);
shelfRouter.put("/:id", updateShelf);
shelfRouter.delete("/:id", deleteShelf);
