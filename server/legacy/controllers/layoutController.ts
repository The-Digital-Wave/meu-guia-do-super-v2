import type { Request, Response } from "express";

import { layoutRepository } from "../repositories/layoutRepository.js";
import { createLayoutSchema, updateLayoutSchema } from "../utils/zodSchemas.js";

function readParam(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export async function listLayouts(_request: Request, response: Response) {
  const layouts = await layoutRepository.list();
  return response.json(layouts);
}

export async function getLayout(request: Request, response: Response) {
  const layout = await layoutRepository.findById(readParam(request.params.id));
  if (!layout) {
    return response.status(404).json({ message: "Layout not found" });
  }
  return response.json(layout);
}

export async function createLayout(request: Request, response: Response) {
  const payload = createLayoutSchema.parse(request.body);
  const layout = await layoutRepository.create(payload);
  return response.status(201).json(layout);
}

export async function updateLayout(request: Request, response: Response) {
  const payload = updateLayoutSchema.parse(request.body);
  const layout = await layoutRepository.update(readParam(request.params.id), payload);
  return response.json(layout);
}

export async function deleteLayout(request: Request, response: Response) {
  await layoutRepository.remove(readParam(request.params.id));
  return response.status(204).send();
}
