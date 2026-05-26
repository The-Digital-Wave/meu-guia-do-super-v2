import type { Request, Response } from "express";

import { productRepository } from "../repositories/productRepository.js";
import { createProductSchema, updateProductSchema } from "../utils/zodSchemas.js";

function readParam(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export async function listProducts(request: Request, response: Response) {
  const products = await productRepository.list(
    typeof request.query.q === "string" ? request.query.q : undefined,
    typeof request.query.supermarketId === "string" ? request.query.supermarketId : undefined,
  );
  return response.json(products);
}

export async function getProduct(request: Request, response: Response) {
  const product = await productRepository.findById(readParam(request.params.id));
  if (!product) {
    return response.status(404).json({ message: "Product not found" });
  }
  return response.json(product);
}

export async function createProduct(request: Request, response: Response) {
  const payload = createProductSchema.parse(request.body);
  const product = await productRepository.create(payload);
  return response.status(201).json(product);
}

export async function updateProduct(request: Request, response: Response) {
  const payload = updateProductSchema.parse(request.body);
  const product = await productRepository.update(readParam(request.params.id), payload);
  return response.json(product);
}

export async function deleteProduct(request: Request, response: Response) {
  await productRepository.remove(readParam(request.params.id));
  return response.status(204).send();
}
