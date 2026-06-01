# Agent Context: Routing Logic

## Role Scope

You are the Routing Logic Agent. You own all mathematical wayfinding for the grocery store navigation system. You are purely algorithmic — no database writes, no UI output.

## Technical & Tooling Stack

- **Language:** Python 3.11+
- **Graph library:** `networkx` (Dijkstra/A*, connectivity analysis)
- **Benchmark:** [MappedIn grocery store demo](https://app.mappedin.com/map/6679882a8298d5000b85ee89?floor=m_f62f718116360827) — multi-stop ordering, accessibility weighting, and route legibility must match this reference

## System Boundaries & Guidelines

1. **Algorithmic only:** Receive structured data, return structured data. No direct DB access, no frontend code.
2. **Validate before calculating:** Always run `scripts/verify_navigation_graph.py` on the input graph before beginning path calculations. Hard-stop if it exits non-zero.
3. **No partial routes:** Return a complete valid route or return an explicit error. Never return a partial route.
4. **Accessibility-weighted:** Apply accessibility weighting to all path calculations (wider aisles score lower traversal cost).

## Inputs

- Validated node graph: `agents/wayfinding/layout_parser/output/schema.json`
- Shopping list: ordered or unordered list of product node IDs to visit

## Output Format

Write to `agents/wayfinding/routing_logic/output/routing_output.json`:
```json
{
  "waypoints": ["node-1", "node-5", "node-8"],
  "segments": [
    {
      "from_node_id": "<uuid>",
      "to_node_id": "<uuid>",
      "product_id": "<uuid | null>",
      "product_name": "Leite Integral 1L",
      "shelf_label": "Leite & Derivados",
      "shelf_front_node_id": "<uuid | null>",
      "shelf_front_x": 14.2,
      "shelf_front_y": 6.8,
      "path_nodes": [
        {"node_id": "<uuid>", "x": 12.0, "y": 6.8, "label": "aisle-3-west"},
        {"node_id": "<uuid>", "x": 14.2, "y": 6.8, "label": "shelf-front-dairy"}
      ],
      "distance_m": 12.4,
      "estimated_seconds": 15
    }
  ],
  "total_distance_m": 19.6,
  "total_estimated_seconds": 24
}
```

### Segment Field Reference

| Field | Type | Description |
|---|---|---|
| `from_node_id` | UUID | Start node of this segment |
| `to_node_id` | UUID | End node of this segment |
| `product_id` | UUID \| null | Product the shopper is navigating to (null for transit segments) |
| `product_name` | string \| null | Display name of the product (e.g. `"Leite Integral 1L"`) |
| `shelf_label` | string \| null | Human-readable shelf/section label (e.g. `"Leite & Derivados"`) |
| `shelf_front_node_id` | UUID \| null | Node ID of the shelf-front stop where the shopper stops to pick the item |
| `shelf_front_x` | float \| null | X coordinate of the shelf-front node, **in metres** |
| `shelf_front_y` | float \| null | Y coordinate of the shelf-front node, **in metres** |
| `path_nodes` | array | Ordered list of `{node_id, x, y, label}` objects tracing the full path |
| `distance_m` | float | Euclidean walking distance for this segment in metres |
| `estimated_seconds` | int | Estimated traversal time in seconds (walking speed ~1.2 m/s) |

> **Coordinate space note:** `shelf_front_x` and `shelf_front_y` are expressed in the same **metre coordinate space** as the layout dimensions (`width_m`, `height_m` from `schema.json`). They are **not** normalised 0–1 values. The client uses these absolute metre coordinates to compute the camera bearing angle for map rotation when approaching a shelf stop.

## Automated Execution Workflow

1. **Gate check:** Run `python scripts/verify_navigation_graph.py` — abort immediately if non-zero
2. **Load graph:** Parse `agents/wayfinding/layout_parser/output/schema.json` into a networkx DiGraph
3. **Snap coordinates:** Map each product location to the nearest navigable node
4. **Order stops:** Apply nearest-neighbor heuristic for multi-stop ordering (matches MappedIn benchmark behaviour)
5. **Calculate paths:** Run Dijkstra's algorithm with accessibility weighting between each consecutive stop pair
6. **Format output:** Build routing segments with enriched fields — `from_node_id`, `to_node_id`, `product_id`, `product_name`, `shelf_label`, `shelf_front_node_id`, `shelf_front_x`, `shelf_front_y`, `path_nodes`, `distance_m`, and `estimated_seconds` — per segment
7. **Write output:** Save to `agents/wayfinding/routing_logic/output/routing_output.json`

## Definition of Done (DoD)

- Output JSON contains both `waypoints` and `segments` keys with at least one entry each
- All waypoint node IDs exist in the validated input graph
- `total_distance_m` equals the sum of all segment `distance_m` values
- Route visits all requested product nodes
- `scripts/verify_navigation_graph.py` exits 0 before any calculation begins
