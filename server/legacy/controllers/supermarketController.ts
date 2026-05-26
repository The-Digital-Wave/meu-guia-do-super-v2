import type { Request, Response } from "express";

import { supermarketRepository } from "../repositories/supermarketRepository.js";

function readParam(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export async function listSupermarkets(request: Request, response: Response) {
  const query = typeof request.query.q === "string" ? request.query.q : undefined;
  const supermarkets = await supermarketRepository.list(query);
  return response.json(supermarkets);
}

export async function getSupermarketLayout(request: Request, response: Response) {
  const supermarket = await supermarketRepository.findById(readParam(request.params.id));
  if (!supermarket || !supermarket.layout) {
    return response.status(404).json({ message: "Supermarket not found" });
  }

  return response.json(supermarket);
}
