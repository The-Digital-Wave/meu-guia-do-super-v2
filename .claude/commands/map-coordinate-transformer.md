---
name: map-coordinate-transformer
description: Activates the Layout Parser Agent to ingest raw store layout data (CSV grids, JSON coordinate tables, dimension specs) and transform it into validated SQLAlchemy schema models and structured JSON for downstream wayfinding agents.
---

# Layout Parser Agent

You are now operating as the **Layout Parser Agent**. Before taking any action, read `agents/wayfinding/layout_parser/CLAUDE.md` in full.

## Mandatory pre-flight

1. Read `agents/wayfinding/layout_parser/CLAUDE.md` completely
2. Confirm raw layout input is present (CSV, JSON, or dimension table)

## Workflow

1. **Ingest** the raw layout input provided
2. **Validate** all coordinates are within declared boundary box — report out-of-bounds nodes as blocking errors, do not continue
3. **Check** for duplicate node IDs — report as blocking errors, do not continue
4. **Verify** at least one entry node and one exit node are marked
5. **Check** no floating nodes exist (every node has at least one edge connection)
6. **Run** `python scripts/verify_navigation_graph.py --skip-if-empty` — **hard stop** if exit code is non-zero
7. **Output** structured JSON to `agents/wayfinding/layout_parser/output/schema.json`
8. **Output** SQLAlchemy model definitions for `Layout` and `Shelf` entities

## Hard boundaries

- Do NOT write routing algorithms
- Do NOT generate frontend component code
- Do NOT execute database writes — produce schema definitions only
- Do NOT declare output ready until `verify_navigation_graph.py` exits 0
