import { prisma } from "../utils/prisma.js";

/**
 * How a Route Is Computed:
 *    1. Customer searches for products → finds StockPlacement records
 *    2. Each StockPlacement has a pickNodeId → an IndoorNode of type PICKUP
 *    3. The Shelf itself has an accessNodeId → the nearest IndoorNode to that shelf (the "entrance" to the aisle gap)
 *    4. The navigation algorithm loads all IndoorNode + IndoorEdge for the layout and builds the graph in memory
 *    5. Starting from the ENTRANCE node, it runs shortest-path through all PICKUP nodes (a variant of the Travelling Salesman / Greedy nearest-neighbor problem)
 *    6. The result is an ordered sequence of nodes with x/y coordinates → rendered as a path on the canvas
 */

type Point = { x: number; y: number };

type NodeRef = {
  id: string;
  code: string;
  x: number;
  y: number;
  type: "ENTRANCE" | "INTERSECTION" | "PICKUP" | "CHECKOUT" | "WAYPOINT";
};

type ResolvedTarget = {
  productId: string;
  productName: string;
  nodeId: string;
  nodeCode: string;
  point: Point;
  shelfName: string;
  sectionName: string;
};

type GraphPayload = {
  layout: {
    id: string;
    width: number;
    height: number;
    unit: string;
    navigationNodes: NodeRef[];
    navigationEdges: Array<{
      fromNodeId: string;
      toNodeId: string;
      distanceMeters: number;
      bidirectional: boolean;
      speedFactor: number;
      accessibilityScore: number;
    }>;
    shelves: Array<{
      id: string;
      name: string;
      sectionName: string;
      x: number;
      y: number;
      width: number;
      height: number;
      accessNodeId: string | null;
      placements: Array<{
        productId: string;
        pickNodeId: string | null;
        product: { id: string; name: string };
      }>;
    }>;
  };
};

type PreviewStart = {
  start?: Point;
  startNodeId?: string;
};

type DijkstraResult = {
  distanceByNode: Map<string, number>;
  previousNode: Map<string, string>;
};

function sanitizeEdgeWeight(distanceMeters: number, speedFactor: number, accessibilityScore: number) {
  const safeDistance = Math.max(distanceMeters, 0.0001);
  const safeSpeedFactor = Math.max(speedFactor, 0.1);
  const safeAccessibility = Math.max(accessibilityScore, 0.1);
  return safeDistance * safeSpeedFactor * (1 / safeAccessibility);
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function nodeToPoint(node: NodeRef): Point {
  return { x: node.x, y: node.y };
}

function toPointPath(pathNodes: NodeRef[]) {
  return pathNodes.map((node) => nodeToPoint(node));
}

function buildAdjacency(layout: GraphPayload["layout"]) {
  const adjacency = new Map<string, Array<{ nodeId: string; weight: number; distanceMeters: number }>>();

  for (const node of layout.navigationNodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of layout.navigationEdges) {
    const weight = sanitizeEdgeWeight(edge.distanceMeters, edge.speedFactor, edge.accessibilityScore);
    adjacency.get(edge.fromNodeId)?.push({ nodeId: edge.toNodeId, weight, distanceMeters: edge.distanceMeters });

    if (edge.bidirectional) {
      adjacency.get(edge.toNodeId)?.push({ nodeId: edge.fromNodeId, weight, distanceMeters: edge.distanceMeters });
    }
  }

  return adjacency;
}

function reconstructNodePath(previousNode: Map<string, string>, startNodeId: string, endNodeId: string) {
  const result = [endNodeId];
  let cursor = endNodeId;

  while (previousNode.has(cursor)) {
    cursor = previousNode.get(cursor) as string;
    result.unshift(cursor);
  }

  if (result[0] !== startNodeId) {
    return [];
  }

  return result;
}

function runDijkstra(adjacency: Map<string, Array<{ nodeId: string; weight: number }>>, startNodeId: string): DijkstraResult {
  const distanceByNode = new Map<string, number>();
  const previousNode = new Map<string, string>();
  const queue: Array<{ nodeId: string; distance: number }> = [];

  for (const nodeId of adjacency.keys()) {
    distanceByNode.set(nodeId, Infinity);
  }

  distanceByNode.set(startNodeId, 0);
  queue.push({ nodeId: startNodeId, distance: 0 });

  while (queue.length > 0) {
    queue.sort((a, b) => a.distance - b.distance);
    const current = queue.shift() as { nodeId: string; distance: number };

    if (current.distance > (distanceByNode.get(current.nodeId) ?? Infinity)) {
      continue;
    }

    const neighbors = adjacency.get(current.nodeId) ?? [];
    for (const neighbor of neighbors) {
      const candidateDistance = current.distance + neighbor.weight;
      if (candidateDistance < (distanceByNode.get(neighbor.nodeId) ?? Infinity)) {
        distanceByNode.set(neighbor.nodeId, candidateDistance);
        previousNode.set(neighbor.nodeId, current.nodeId);
        queue.push({ nodeId: neighbor.nodeId, distance: candidateDistance });
      }
    }
  }

  return { distanceByNode, previousNode };
}

function findNearestNode(nodes: NodeRef[], point: Point) {
  return nodes
    .map((node) => ({ node, distance: distance(point, nodeToPoint(node)) }))
    .sort((a, b) => a.distance - b.distance)[0]?.node;
}

function getNodeMap(nodes: NodeRef[]) {
  return new Map(nodes.map((node) => [node.id, node]));
}

async function getGraph(supermarketId: string) {
  const layout = await prisma.layout.findFirst({
    where: { supermarketId },
    select: {
      id: true,
      width: true,
      height: true,
      unit: true,
      navigationNodes: {
        select: {
          id: true,
          code: true,
          x: true,
          y: true,
          type: true,
        },
      },
      navigationEdges: {
        select: {
          fromNodeId: true,
          toNodeId: true,
          distanceMeters: true,
          bidirectional: true,
          speedFactor: true,
          accessibilityScore: true,
        },
      },
      shelves: {
        select: {
          id: true,
          name: true,
          sectionName: true,
          x: true,
          y: true,
          width: true,
          height: true,
          accessNodeId: true,
          placements: {
            select: {
              productId: true,
              pickNodeId: true,
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!layout) {
    throw new Error("Layout not found for supermarket");
  }

  if (layout.navigationNodes.length === 0 || layout.navigationEdges.length === 0) {
    throw new Error("Indoor navigation graph is not configured for this supermarket");
  }

  return { layout } satisfies GraphPayload;
}

function resolveStartNode(layout: GraphPayload["layout"], input: PreviewStart) {
  const nodeById = getNodeMap(layout.navigationNodes);

  if (input.startNodeId) {
    const explicit = nodeById.get(input.startNodeId);
    if (!explicit) {
      throw new Error("startNodeId does not exist in supermarket graph");
    }
    return explicit;
  }

  if (!input.start) {
    throw new Error("start position is required when startNodeId is not provided");
  }

  const nearest = findNearestNode(layout.navigationNodes, input.start);
  if (!nearest) {
    throw new Error("Unable to resolve nearest graph node from start point");
  }

  return nearest;
}

function resolveTargets(layout: GraphPayload["layout"], productIds: string[], fromNodeId?: string) {
  const nodeById = getNodeMap(layout.navigationNodes);
  const targets: ResolvedTarget[] = [];

  for (const shelf of layout.shelves) {
    for (const placement of shelf.placements) {
      if (!productIds.includes(placement.productId)) {
        continue;
      }

      const candidateNodeId = placement.pickNodeId ?? shelf.accessNodeId;
      if (!candidateNodeId) {
        continue;
      }

      const node = nodeById.get(candidateNodeId);
      if (!node) {
        continue;
      }

      targets.push({
        productId: placement.productId,
        productName: placement.product.name,
        nodeId: node.id,
        nodeCode: node.code,
        point: nodeToPoint(node),
        shelfName: shelf.name,
        sectionName: shelf.sectionName,
      });
    }
  }

  if (!fromNodeId) {
    return targets;
  }

  return targets.sort((a, b) => (a.nodeId === fromNodeId ? -1 : 0) - (b.nodeId === fromNodeId ? -1 : 0));
}

function buildRouteSegment(
  startNodeId: string,
  targetNodeId: string,
  nodes: NodeRef[],
  adjacency: Map<string, Array<{ nodeId: string; weight: number }>>,
) {
  const nodeById = getNodeMap(nodes);
  const dijkstra = runDijkstra(adjacency, startNodeId);
  const score = dijkstra.distanceByNode.get(targetNodeId);

  if (score === undefined || score === Infinity) {
    throw new Error(`No path found between nodes ${startNodeId} and ${targetNodeId}`);
  }

  const pathNodeIds = reconstructNodePath(dijkstra.previousNode, startNodeId, targetNodeId);
  const pathNodes = pathNodeIds.map((nodeId) => nodeById.get(nodeId)).filter(Boolean) as NodeRef[];

  return {
    distance: Number(score.toFixed(2)),
    pathNodeIds,
    points: toPointPath(pathNodes),
  };
}

export async function getNavigationGraph(supermarketId: string) {
  const { layout } = await getGraph(supermarketId);
  return {
    layoutId: layout.id,
    width: layout.width,
    height: layout.height,
    unit: layout.unit,
    nodes: layout.navigationNodes,
    edges: layout.navigationEdges,
  };
}

export async function snapPosition(supermarketId: string, point: Point) {
  const { layout } = await getGraph(supermarketId);
  const nearest = findNearestNode(layout.navigationNodes, point);

  if (!nearest) {
    throw new Error("Unable to snap position to navigation graph");
  }

  return {
    requestedPoint: point,
    snappedNode: {
      id: nearest.id,
      code: nearest.code,
      type: nearest.type,
      point: nodeToPoint(nearest),
      distance: Number(distance(point, nodeToPoint(nearest)).toFixed(2)),
    },
  };
}

export async function previewRoute(supermarketId: string, input: PreviewStart & { productId: string }) {
  const { layout } = await getGraph(supermarketId);
  const startNode = resolveStartNode(layout, input);
  const targets = resolveTargets(layout, [input.productId], startNode.id);
  const target = targets[0];

  if (!target) {
    throw new Error("Product not found in selected supermarket graph");
  }

  const adjacency = buildAdjacency(layout);
  const segment = buildRouteSegment(startNode.id, target.nodeId, layout.navigationNodes, adjacency);

  return {
    target,
    startNode: {
      id: startNode.id,
      code: startNode.code,
      point: nodeToPoint(startNode),
    },
    distance: segment.distance,
    nodeIds: segment.pathNodeIds,
    points: segment.points,
  };
}

export async function optimizeRoute(
  supermarketId: string,
  input: PreviewStart & { productIds: string[] },
) {
  const { layout } = await getGraph(supermarketId);
  const startNode = resolveStartNode(layout, input);
  const uniqueProductIds = [...new Set(input.productIds)];
  const targets = resolveTargets(layout, uniqueProductIds, startNode.id);
  const unresolvedProducts = uniqueProductIds.filter((productId) => !targets.some((target) => target.productId === productId));

  if (targets.length === 0) {
    throw new Error("None of the requested products have mapped pickup nodes in this supermarket");
  }

  const adjacency = buildAdjacency(layout);
  const remainingProducts = new Set(uniqueProductIds.filter((productId) => targets.some((target) => target.productId === productId)));
  const segments: Array<{
    productId: string;
    productName: string;
    shelfName: string;
    sectionName: string;
    distance: number;
    nodeIds: string[];
    points: Point[];
  }> = [];

  let cursorNodeId = startNode.id;

  while (remainingProducts.size > 0) {
    const candidates = targets.filter((target) => remainingProducts.has(target.productId));
    const ranked = candidates
      .map((target) => {
        const segment = buildRouteSegment(cursorNodeId, target.nodeId, layout.navigationNodes, adjacency);
        return { target, segment };
      })
      .sort((a, b) => a.segment.distance - b.segment.distance);

    const next = ranked[0];
    segments.push({
      productId: next.target.productId,
      productName: next.target.productName,
      shelfName: next.target.shelfName,
      sectionName: next.target.sectionName,
      distance: next.segment.distance,
      nodeIds: next.segment.pathNodeIds,
      points: next.segment.points,
    });

    cursorNodeId = next.target.nodeId;
    remainingProducts.delete(next.target.productId);
  }

  return {
    startNode: {
      id: startNode.id,
      code: startNode.code,
      point: nodeToPoint(startNode),
    },
    totalDistance: Number(segments.reduce((sum, segment) => sum + segment.distance, 0).toFixed(2)),
    unresolvedProducts,
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
