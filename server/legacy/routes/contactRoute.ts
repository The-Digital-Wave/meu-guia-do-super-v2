import { Router } from "express";

import { createContactMessage } from "../controllers/contactController.js";

export const contactRouter = Router();

contactRouter.post("/", createContactMessage);
