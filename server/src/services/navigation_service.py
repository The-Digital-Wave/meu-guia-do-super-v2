"""Navigation service — graph construction and wayfinding algorithms.

All algorithm logic lives here. Controllers only extract input and map errors.
Graph cache is module-level (not per-request); suitable for dev/test.
"""
import logging
import math
from uuid import UUID

import networkx as nx
from sqlalchemy.ext.asyncio import AsyncSession

from src.repositories import edge_repository, node_repository, product_repository, shelf_repository

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module-level graph cache (layout_id → DiGraph)
# ---------------------------------------------------------------------------

_graph_cache: dict[UUID, nx.DiGraph] = {}

WALKING_SPEED_MS = 0.8  # metres per second


def _invalidate_cache(layout_id: UUID) -> None:
    """Evict a layout graph from the module-level cache (e.g. after topology change)."""
    _graph_cache.pop(layout_id, None)


async def get_or_build_graph(db: AsyncSession, layout_id: UUID) -> nx.DiGraph:
    """Return cached graph or build from DB nodes/edges."""
    if layout_id in _graph_cache:
        return _graph_cache[layout_id]
    graph = await _build_graph(db, layout_id)
    _graph_cache[layout_id] = graph
    logger.warning(
        "Navigation graph cached for layout %s. "
        "Cache is NOT automatically invalidated on node/edge changes (MVP limitation). "
        "Restart the server to pick up layout changes.",
        layout_id,
    )
    return graph


async def _build_graph(db: AsyncSession, layout_id: UUID) -> nx.DiGraph:
    """Load all nodes and edges for layout_id from DB and return a DiGraph.

    Node attributes: x, y, node_type, label.
    Edge weight = distance_m (accessibility_weight is 1.0 default).
    Bidirectional edges are added in both directions.
    """
    nodes = await node_repository.get_by_layout(db, layout_id)
    edges = await edge_repository.get_by_layout(db, layout_id)

    if not nodes:
        raise ValueError(f"Layout {layout_id} not found or has no nodes")

    g: nx.DiGraph = nx.DiGraph()

    for node in nodes:
        g.add_node(
            node.id,
            x=node.x,
            y=node.y,
            node_type=node.node_type,
            label=node.label,
        )

    for edge in edges:
        g.add_edge(edge.node_from_id, edge.node_to_id, weight=edge.distance_m)
        if edge.bidirectional:
            g.add_edge(edge.node_to_id, edge.node_from_id, weight=edge.distance_m)

    return g


# ---------------------------------------------------------------------------
# TSP heuristic
# ---------------------------------------------------------------------------


def nearest_neighbor_tsp(
    graph: nx.DiGraph,
    start: UUID,
    targets: list[UUID],
) -> list[UUID]:
    """Nearest-neighbor heuristic: order *targets* by proximity from *start*.

    Returns ordered list of targets (start is excluded from result).
    Raises ValueError if any target is unreachable from start.
    """
    if not targets:
        return []

    remaining = list(targets)
    ordered: list[UUID] = []
    current = start

    while remaining:
        best: UUID | None = None
        best_dist: float = math.inf

        for candidate in remaining:
            try:
                dist: float = nx.dijkstra_path_length(graph, current, candidate, weight="weight")
            except nx.NetworkXNoPath:
                raise ValueError(
                    f"No path from {current} to {candidate} in layout graph"
                )
            except nx.NodeNotFound as exc:
                raise ValueError(str(exc))

            if dist < best_dist:
                best_dist = dist
                best = candidate

        if best is None:
            break  # unreachable; guarded by the raise above

        ordered.append(best)
        remaining.remove(best)
        current = best

    return ordered


# ---------------------------------------------------------------------------
# Route calculation
# ---------------------------------------------------------------------------


async def calculate_route(
    db: AsyncSession,
    layout_id: UUID,
    start_node_id: UUID,
    product_ids: list[UUID],
) -> dict:
    """Calculate turn-by-turn route from start node through all product locations.

    Steps:
    1. Build/fetch graph for layout_id.
    2. For each product_id, resolve shelf → shelf.node_id (SHELF_FRONT anchor).
    3. Order stops via nearest-neighbor TSP.
    4. Run Dijkstra between consecutive stops.
    5. Return full RouteResponse dict.

    Raises ValueError on any unresolvable input (maps to 422/404 at controller layer).
    """
    graph = await get_or_build_graph(db, layout_id)

    if start_node_id not in graph:
        raise ValueError(f"Start node {start_node_id} not found in layout {layout_id}")

    # Resolve each product → its shelf node_id
    product_to_node: dict[UUID, UUID] = {}
    for pid in product_ids:
        product = await product_repository.get_by_id(db, pid)
        if product is None:
            raise ValueError(f"Product {pid} not found")
        if product.shelf_id is None:
            raise ValueError(f"Product {pid} has no associated shelf")

        shelf = await shelf_repository.get_by_id(db, product.shelf_id)
        if shelf is None:
            raise ValueError(f"Shelf {product.shelf_id} not found for product {pid}")
        if shelf.node_id is None:
            raise ValueError(
                f"Shelf {shelf.id} has no anchor node — cannot route to product {pid}"
            )
        product_to_node[pid] = shelf.node_id

    # Guard: verify every resolved shelf node exists in this layout's graph
    for pid, nid in product_to_node.items():
        if nid not in graph:
            raise ValueError(
                f"Shelf anchor node {nid} for product {pid} is not part of layout {layout_id} graph"
            )

    # De-duplicate target nodes while preserving product association order
    unique_target_nodes = list(dict.fromkeys(product_to_node.values()))

    # TSP ordering on target nodes
    ordered_nodes = nearest_neighbor_tsp(graph, start_node_id, unique_target_nodes)

    # Map back: for each ordered node, find *which* product(s) it serves.
    # Take the first product_id mapped to that node for the segment label.
    node_to_first_product: dict[UUID, UUID] = {}
    for pid, nid in product_to_node.items():
        if nid not in node_to_first_product:
            node_to_first_product[nid] = pid

    # Build segments
    segments: list[dict] = []
    all_waypoints: list[UUID] = [start_node_id]
    current = start_node_id

    for target_node in ordered_nodes:
        try:
            dist, path = nx.single_source_dijkstra(graph, current, target_node, weight="weight")
        except nx.NetworkXNoPath:
            raise ValueError(f"No path from {current} to {target_node} in layout {layout_id}")

        segments.append(
            {
                "from_node_id": current,
                "to_node_id": target_node,
                "product_id": node_to_first_product.get(target_node),
                "path_nodes": path,
                "distance_m": round(dist, 4),
                "estimated_seconds": math.ceil(dist / WALKING_SPEED_MS),
            }
        )

        # Extend waypoints (skip the first node — it's already in the list as previous stop)
        all_waypoints.extend(path[1:])
        current = target_node

    total_distance = sum(s["distance_m"] for s in segments)
    total_seconds = math.ceil(total_distance / WALKING_SPEED_MS)

    return {
        "layout_id": layout_id,
        "start_node_id": start_node_id,
        "waypoints": all_waypoints,
        "segments": segments,
        "total_distance_m": round(total_distance, 4),
        "total_estimated_seconds": total_seconds,
    }


# ---------------------------------------------------------------------------
# List order optimiser (used by grocery list endpoint)
# ---------------------------------------------------------------------------


async def optimize_list_order(
    db: AsyncSession,
    layout_id: UUID,
    start_node_id: UUID,
    product_ids: list[UUID],
) -> list[UUID]:
    """Return product_ids reordered by nearest-neighbor TSP from start_node_id.

    Products with no shelf/node are placed at the end unchanged.
    Raises ValueError if layout or start node not found.
    """
    if not product_ids:
        return product_ids

    graph = await get_or_build_graph(db, layout_id)

    if start_node_id not in graph:
        raise ValueError(f"Start node {start_node_id} not found in layout {layout_id}")

    # Resolve product → node; products without nodes go to the tail
    resolvable: list[tuple[UUID, UUID]] = []  # (product_id, node_id)
    unresolvable: list[UUID] = []

    for pid in product_ids:
        product = await product_repository.get_by_id(db, pid)
        if product is None or product.shelf_id is None:
            unresolvable.append(pid)
            continue
        shelf = await shelf_repository.get_by_id(db, product.shelf_id)
        if shelf is None or shelf.node_id is None:
            unresolvable.append(pid)
            continue
        resolvable.append((pid, shelf.node_id))

    if not resolvable:
        return product_ids

    # Build ordered target nodes (de-duplicated)
    unique_nodes = list(dict.fromkeys(nid for _, nid in resolvable))
    try:
        ordered_nodes = nearest_neighbor_tsp(graph, start_node_id, unique_nodes)
    except ValueError:
        # Cannot route — return original order
        return product_ids

    # Map node → products in original order
    node_to_products: dict[UUID, list[UUID]] = {}
    for pid, nid in resolvable:
        node_to_products.setdefault(nid, []).append(pid)

    ordered_products: list[UUID] = []
    for nid in ordered_nodes:
        ordered_products.extend(node_to_products.get(nid, []))

    return ordered_products + unresolvable
