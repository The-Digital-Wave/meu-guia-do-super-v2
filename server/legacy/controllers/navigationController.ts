import type { Request, Response } from "express";

import { getNavigationGraph, optimizeRoute, previewRoute, snapPosition } from "../services/navigationService.js";
import { getNavigationGraphSchema, optimizeRouteSchema, previewRouteSchema, snapPositionSchema } from "../utils/zodSchemas.js";

function readParam(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export async function getIndoorGraph(request: Request, response: Response) {
  const payload = getNavigationGraphSchema.parse({ supermarketId: readParam(request.params.supermarketId) });
  const graph = await getNavigationGraph(payload.supermarketId);
  return response.json(graph);
}

export async function postSnapPosition(request: Request, response: Response) {
  const payload = snapPositionSchema.parse(request.body);
  const snapped = await snapPosition(payload.supermarketId, payload.point);
  return response.json(snapped);
}

export async function getPreviewRoute(request: Request, response: Response) {
  const payload = previewRouteSchema.parse(request.body);
  const route = await previewRoute(payload.supermarketId, {
    productId: payload.productId,
    start: payload.start,
    startNodeId: payload.startNodeId,
  });
  return response.json(route);
}

export async function getOptimizedRoute(request: Request, response: Response) {
  const payload = optimizeRouteSchema.parse(request.body);
  const route = await optimizeRoute(payload.supermarketId, {
    productIds: payload.productIds,
    start: payload.start,
    startNodeId: payload.startNodeId,
  });
  return response.json(route);
}
