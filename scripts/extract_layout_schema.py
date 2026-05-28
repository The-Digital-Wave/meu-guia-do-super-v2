#!/usr/bin/env python3
"""
Extract layout schema from seed data and write to:
  agents/wayfinding/layout_parser/output/schema.json

The output format is understood by:
  - scripts/verify_navigation_graph.py  (validation)
  - agents/wayfinding/routing_logic/    (Dijkstra agent)

Idempotent: safe to re-run; overwrites the file each time.

Usage (from repo root):
    python scripts/extract_layout_schema.py
"""

from __future__ import annotations

import json
import sys
import uuid
from pathlib import Path

# ---------------------------------------------------------------------------
# Make seed data importable without invoking asyncio.run() or a live DB
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "server"))

# The seed module defines NODES, EDGES, SHELVES, PRODUCTS at import time.
# We import only those constants — no DB connection is opened here.
import os

# Prevent settings from demanding a real DATABASE_URL at import time
if "DATABASE_URL" not in os.environ:
    os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./dummy.db"

from scripts.seed import (  # noqa: E402
    EDGES,
    LAYOUT_ID,
    NODES,
    PRODUCTS,
    SHELVES,
)

# ---------------------------------------------------------------------------
# Node type mapping: SQLAlchemy enum → validator string
# ---------------------------------------------------------------------------

# NodeType enum values from the seed
NODE_TYPE_MAP: dict[str, str] = {
    "ENTRY": "entry",
    "EXIT": "exit",
    "INTERSECTION": "intersection",
    "SHELF_FRONT": "shelf_front",
}


def _node_type_str(node_type) -> str:
    """Convert NodeType enum (or string) to lowercase validator string."""
    raw = node_type.value if hasattr(node_type, "value") else str(node_type)
    return NODE_TYPE_MAP.get(raw, raw.lower())


# ---------------------------------------------------------------------------
# Build the schema dict
# ---------------------------------------------------------------------------

def build_schema() -> dict:
    layout_id = str(LAYOUT_ID)

    # Nodes — validator expects: id, type, coordinates.{x,y}
    nodes_out = [
        {
            "id": str(n["id"]),
            "type": _node_type_str(n["node_type"]),
            "label": n.get("label", ""),
            "coordinates": {
                "x": n["x"],
                "y": n["y"],
            },
            "accessible": n.get("accessible", True),
        }
        for n in NODES
    ]

    # Edges — validator expects: id, from, to, distance_m, bidirectional
    edges_out = [
        {
            "id": str(e["id"]),
            "from": str(e["node_from_id"]),
            "to": str(e["node_to_id"]),
            "distance_m": e["distance_m"],
            "bidirectional": e.get("bidirectional", True),
            "accessibility_weight": e.get("accessibility_weight", 1.0),
        }
        for e in EDGES
    ]

    # Shelves
    shelves_out = [
        {
            "id": str(s["id"]),
            "node_id": str(s["node_id"]),
            "aisle": s.get("aisle", ""),
            "section": s.get("section", ""),
            "label": s.get("label", ""),
        }
        for s in SHELVES
    ]

    # Products
    products_out = [
        {
            "id": str(p["id"]),
            "shelf_id": str(p["shelf_id"]),
            "name": p["name"],
            "category": p.get("category", ""),
        }
        for p in PRODUCTS
    ]

    # Bounds: nodes use normalised [0.0, 1.0] coordinates
    return {
        "layout_id": layout_id,
        "layout_name": "Planta Principal",
        "width_m": 50.0,
        "height_m": 30.0,
        "bounds": {
            "min_x": 0.0,
            "max_x": 1.0,
            "min_y": 0.0,
            "max_y": 1.0,
        },
        "nodes": nodes_out,
        "edges": edges_out,
        "shelves": shelves_out,
        "products": products_out,
    }


# ---------------------------------------------------------------------------
# Write output
# ---------------------------------------------------------------------------

def main() -> None:
    output_path = REPO_ROOT / "agents" / "wayfinding" / "layout_parser" / "output" / "schema.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    schema = build_schema()

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(schema, f, ensure_ascii=False, indent=2)

    print(f"schema.json written to: {output_path}")
    print(f"  layout_id : {schema['layout_id']}")
    print(f"  nodes     : {len(schema['nodes'])}")
    print(f"  edges     : {len(schema['edges'])}")
    print(f"  shelves   : {len(schema['shelves'])}")
    print(f"  products  : {len(schema['products'])}")


if __name__ == "__main__":
    main()
