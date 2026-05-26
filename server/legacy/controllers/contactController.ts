import type { Request, Response } from "express";

import { prisma } from "../utils/prisma.js";
import { contactSchema } from "../utils/zodSchemas.js";

export async function createContactMessage(request: Request, response: Response) {
  const payload = contactSchema.parse(request.body);
  const message = await prisma.contactMessage.create({ data: payload });
  return response.status(201).json(message);
}
