import type { Request, Response } from "express";

import { shelfRepository } from "../repositories/shelfRepository.js";
import { createShelfSchema, updateShelfSchema } from "../utils/zodSchemas.js";

function readParam(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export async function listShelves(_request: Request, response: Response) {
  const shelves = await shelfRepository.list();
  return response.json(shelves);
}

export async function getShelf(request: Request, response: Response) {
  const shelf = await shelfRepository.findById(readParam(request.params.id));
  if (!shelf) {
    return response.status(404).json({ message: "Shelf not found" });
  }
  return response.json(shelf);
}

export async function createShelf(request: Request, response: Response) {
  const payload = createShelfSchema.parse(request.body);
  const shelf = await shelfRepository.create(payload);
  return response.status(201).json(shelf);
}

export async function updateShelf(request: Request, response: Response) {
  const payload = updateShelfSchema.parse(request.body);
  const shelf = await shelfRepository.update(readParam(request.params.id), payload);
  return response.json(shelf);
}

export async function deleteShelf(request: Request, response: Response) {
  await shelfRepository.remove(readParam(request.params.id));
  return response.status(204).send();
}
