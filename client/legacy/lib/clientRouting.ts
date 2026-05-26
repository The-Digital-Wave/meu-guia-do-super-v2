import PriorityQueue from "js-priority-queue";

import type { IndoorNode, OptimizedRoute, Point, PreviewRoute, Supermarket } from "../types/domain";

type TargetStop = {
  productId: string;
  productName: string;
  shelfName: string;
  sectionName: string;
  nodeId: string;
  point: Point;
};

type WeightedEdge = {
  toNodeId: string;
  weight: number;
};

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function toPoint(node: IndoorNode): Point {
  return { x: node.x, y: node.y };
}

function edgeWeight(distanceMeters: number, speedFactor: number, accessibilityScore: number) {
  const safeDistance = Math.max(distanceMeters, 0.0001);
  const safeSpeed = Math.max(speedFactor, 0.1);
  const safeAccessibility = Math.max(accessibilityScore, 0.1);
  return safeDistance * safeSpeed * (1 / safeAccessibility);
}

function getGraph(supermarket: Supermarket) {
  const layout = supermarket.layout;
  if (!layout) {
    throw new Error("Supermarket layout is missing");
  }

  const nodes = layout.navigationNodes ?? [];
  const edges = layout.navigationEdges ?? [];

  if (nodes.length === 0 || edges.length === 0) {
    throw new Error("Indoor graph is not configured for this supermarket");
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const adjacency = new Map<string, WeightedEdge[]>();

  for (const node of nodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    const weight = edgeWeight(edge.distanceMeters, edge.speedFactor, edge.accessibilityScore);
    adjacency.get(edge.fromNodeId)?.push({ toNodeId: edge.toNodeId, weight });
    if (edge.bidirectional) {
      adjacency.get(edge.toNodeId)?.push({ toNodeId: edge.fromNodeId, weight });
    }
  }

  return { nodeById, adjacency };
}

function nearestNodeId(nodes: IndoorNode[], point: Point) {
  const nearest = nodes
    .map((node) => ({ node, d: distance(point, toPoint(node)) }))
    .sort((a, b) => a.d - b.d)[0]?.node;

  if (!nearest) {
    throw new Error("No graph nodes available");
  }

  return nearest.id;
}

function dijkstra(adjacency: Map<string, WeightedEdge[]>, startNodeId: string) {
  const distances = new Map<string, number>();
  const previous = new Map<string, string>();
  const queue = new PriorityQueue<{ nodeId: string; distance: number }>({
    comparator: (a, b) => a.distance - b.distance,
  });

  for (const nodeId of adjacency.keys()) {
    distances.set(nodeId, Infinity);
  }

  distances.set(startNodeId, 0);
  queue.queue({ nodeId: startNodeId, distance: 0 });

  while (queue.length > 0) {
    const current = queue.dequeue();
    if (current.distance > (distances.get(current.nodeId) ?? Infinity)) {
      continue;
    }

    const neighbors = adjacency.get(current.nodeId) ?? [];
    for (const neighbor of neighbors) {
      const candidateDistance = current.distance + neighbor.weight;
      if (candidateDistance < (distances.get(neighbor.toNodeId) ?? Infinity)) {
        distances.set(neighbor.toNodeId, candidateDistance);
        previous.set(neighbor.toNodeId, current.nodeId);
        queue.queue({ nodeId: neighbor.toNodeId, distance: candidateDistance });
      }
    }
  }

  return { distances, previous };
}

function reconstructPath(previous: Map<string, string>, startNodeId: string, endNodeId: string) {
  const result = [endNodeId];
  let cursor = endNodeId;

  while (previous.has(cursor)) {
    cursor = previous.get(cursor) as string;
    result.unshift(cursor);
  }

  if (result[0] !== startNodeId) {
    return [];
  }

  return result;
}

function resolveTargets(supermarket: Supermarket, requestedProductIds: string[]) {
  const layout = supermarket.layout;
  if (!layout) {
    return [] as TargetStop[];
  }

  const productSet = new Set(requestedProductIds);
  const targets: TargetStop[] = [];

  for (const shelf of layout.shelves) {
    for (const placement of shelf.placements) {
      if (!productSet.has(placement.productId)) {
        continue;
      }

      const nodeId = placement.pickNodeId ?? shelf.accessNodeId;
      if (!nodeId) {
        continue;
      }

      targets.push({
        productId: placement.product.id,
        productName: placement.product.name,
        shelfName: shelf.name,
        sectionName: shelf.sectionName,
        nodeId,
        point: {
          x: shelf.x + shelf.width / 2,
          y: shelf.y + shelf.height + 2,
        },
      });
    }
  }

  return targets;
}

function routeSegment(supermarket: Supermarket, startNodeId: string, endNodeId: string) {
  const { nodeById, adjacency } = getGraph(supermarket);
  const shortest = dijkstra(adjacency, startNodeId);
  const score = shortest.distances.get(endNodeId) ?? Infinity;

  if (!Number.isFinite(score)) {
    throw new Error("Could not find a path between selected nodes");
  }

  const nodeIds = reconstructPath(shortest.previous, startNodeId, endNodeId);
  const points = nodeIds
    .map((nodeId) => nodeById.get(nodeId))
    .filter(Boolean)
    .map((node) => toPoint(node as IndoorNode));

  return {
    distance: Number(score.toFixed(2)),
    nodeIds,
    points,
  };
}

export function previewRouteClient(supermarket: Supermarket, startPoint: Point, productId: string): PreviewRoute {
  const layout = supermarket.layout;
  if (!layout) {
    throw new Error("Supermarket layout is missing");
  }

  const startNodeId = nearestNodeId(layout.navigationNodes ?? [], startPoint);
  const targets = resolveTargets(supermarket, [productId]);
  const target = targets[0];

  if (!target) {
    throw new Error("Product is not mapped to an indoor pickup node");
  }

  const segment = routeSegment(supermarket, startNodeId, target.nodeId);
  const startNode = (layout.navigationNodes ?? []).find((node) => node.id === startNodeId);

  return {
    startNode: {
      id: startNodeId,
      code: startNode?.code ?? "start",
      point: startNode ? toPoint(startNode) : startPoint,
    },
    distance: segment.distance,
    nodeIds: segment.nodeIds,
    target: {
      productId: target.productId,
      productName: target.productName,
      shelfName: target.shelfName,
      sectionName: target.sectionName,
      point: target.point,
    },
    points: segment.points,
  };
}

export function optimizeRouteClient(supermarket: Supermarket, startPoint: Point, productIds: string[]): OptimizedRoute {
  const layout = supermarket.layout;
  if (!layout) {
    throw new Error("Supermarket layout is missing");
  }

  const uniqueProductIds = [...new Set(productIds)];
  const targets = resolveTargets(supermarket, uniqueProductIds);
  const unresolvedProducts = uniqueProductIds.filter((id) => !targets.some((target) => target.productId === id));

  if (targets.length === 0) {
    throw new Error("No selected products have pickup nodes mapped in this store");
  }

  const nodes = layout.navigationNodes ?? [];
  let cursorNodeId = nearestNodeId(nodes, startPoint);
  const startNode = nodes.find((node) => node.id === cursorNodeId);

  const pending = new Set(uniqueProductIds.filter((id) => targets.some((target) => target.productId === id)));
  const segments: OptimizedRoute["segments"] = [];

  while (pending.size > 0) {
    const candidates = targets.filter((target) => pending.has(target.productId));
    const ranked = candidates
      .map((target) => ({ target, segment: routeSegment(supermarket, cursorNodeId, target.nodeId) }))
      .sort((a, b) => a.segment.distance - b.segment.distance);

    const next = ranked[0];
    segments.push({
      productId: next.target.productId,
      productName: next.target.productName,
      shelfName: next.target.shelfName,
      sectionName: next.target.sectionName,
      distance: next.segment.distance,
      nodeIds: next.segment.nodeIds,
      points: next.segment.points,
    });

    cursorNodeId = next.target.nodeId;
    pending.delete(next.target.productId);
  }

  return {
    startNode: {
      id: startNode?.id ?? "start",
      code: startNode?.code ?? "start",
      point: startNode ? toPoint(startNode) : startPoint,
    },
    unresolvedProducts,
    totalDistance: Number(segments.reduce((sum, segment) => sum + segment.distance, 0).toFixed(2)),
    orderedItems: segments.map((segment, index) => ({
      step: index + 1,
      productId: segment.productId,
      productName: segment.productName,
      shelfName: segment.shelfName,
      sectionName: segment.sectionName,
      distance: segment.distance,
    })),
    segments,
  };
}
