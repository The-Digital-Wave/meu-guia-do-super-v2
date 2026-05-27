# Multi-Agent Orchestration Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the wayfinding agent cluster, project skill slash commands, Python validation gate scripts, and update documentation to align the repo with Anthropic multi-agent best practices and switch the server stack to Python + FastAPI.

**Architecture:** Additive changes only — nothing existing is moved or deleted. Three new wayfinding agents live under `agents/wayfinding/`, three project skills live in `.claude/commands/`, and three Python validation scripts live in `scripts/`. All scripts exit `0` (pass) or `1` (fail) for CI integration.

**Tech Stack:** Python 3.11+ (scripts), pytest (testing), React Native + Expo (UI agent context), FastAPI + SQLAlchemy 2.0 (server context)

**Spec:** `docs/superpowers/specs/2026-05-27-multi-agent-orchestration-restructure-design.md`

---

## Task 1: Create Directory Scaffolding

**Files:**
- Create: `agents/wayfinding/layout_parser/` (directory)
- Create: `agents/wayfinding/routing_logic/` (directory)
- Create: `agents/wayfinding/ui_generator/` (directory)
- Create: `.claude/commands/` (directory)
- Create: `scripts/` (directory)
- Create: `tests/` (directory)
- Create: `agents/wayfinding/layout_parser/output/` (directory — gitignored output target)
- Create: `agents/wayfinding/routing_logic/output/` (directory — gitignored output target)

- [ ] **Step 1: Create all required directories**

```bash
mkdir -p agents/wayfinding/layout_parser/output
mkdir -p agents/wayfinding/routing_logic/output
mkdir -p agents/wayfinding/ui_generator
mkdir -p .claude/commands
mkdir -p scripts
mkdir -p tests
```

- [ ] **Step 2: Add .gitkeep files to output directories and gitignore output contents**

```bash
touch agents/wayfinding/layout_parser/output/.gitkeep
touch agents/wayfinding/routing_logic/output/.gitkeep
```

Add to `.gitignore` (open the file and append these two lines):
```
agents/wayfinding/layout_parser/output/*.json
agents/wayfinding/routing_logic/output/*.json
```

- [ ] **Step 3: Verify structure**

```bash
find agents/wayfinding .claude/commands scripts tests -type d
```

Expected output:
```
agents/wayfinding
agents/wayfinding/layout_parser
agents/wayfinding/layout_parser/output
agents/wayfinding/routing_logic
agents/wayfinding/routing_logic/output
agents/wayfinding/ui_generator
.claude/commands
scripts
tests
```

- [ ] **Step 4: Commit**

```bash
git add agents/wayfinding .claude/commands scripts tests .gitignore
git commit -m "chore: scaffold wayfinding agents, skills, scripts, and tests directories"
```

---

## Task 2: Wayfinding Agent CLAUDE.md Files

**Files:**
- Create: `agents/wayfinding/layout_parser/CLAUDE.md`
- Create: `agents/wayfinding/routing_logic/CLAUDE.md`
- Create: `agents/wayfinding/ui_generator/CLAUDE.md`

- [ ] **Step 1: Create Layout Parser CLAUDE.md**

Create `agents/wayfinding/layout_parser/CLAUDE.md` with this exact content:

```markdown
# Agent Context: Layout Parser

## Role Scope

You are the Layout Parser Agent. You are the entry point for all physical store data entering the system. You ingest raw store layout definitions and transform them into validated backend schemas consumable by downstream agents.

## Technical & Tooling Stack

- **Language:** Python 3.11+
- **Validation:** Pydantic v2 (schema definitions)
- **ORM Target:** SQLAlchemy 2.0 async models
- **Graph validation:** `scripts/verify_navigation_graph.py` must exit 0 before output is declared ready

## System Boundaries & Guidelines

1. **Schema definitions only:** Produce SQLAlchemy model definitions and structured JSON. Do NOT execute database writes.
2. **No routing logic:** Do not write or modify pathfinding algorithms — that belongs to the Routing Logic Agent.
3. **No UI:** Do not generate any frontend component code.
4. **Validation gates first:** Flag floating shelves, out-of-bounds coordinates, and missing anchor points as blocking errors before producing output.

## Inputs

- Raw layout definitions: CSV grid files, JSON coordinate tables, dimension specification files from store operators
- Layout boundary declaration: `{"min_x": 0, "max_x": N, "min_y": 0, "max_y": N}`

## Outputs

- `agents/wayfinding/layout_parser/output/schema.json`: structured layout JSON with nodes, edges, and boundary metadata in this shape:
  ```json
  {
    "nodes": [{"id": "node-1", "type": "entry", "coordinates": {"x": 0, "y": 0}}],
    "edges": [{"from": "node-1", "to": "node-2"}],
    "bounds": {"min_x": 0, "max_x": 100, "min_y": 0, "max_y": 100}
  }
  ```
- SQLAlchemy model definitions for `Layout` and `Shelf` entities

## Automated Execution Workflow

1. **Ingest:** Accept raw layout input (CSV, JSON, or dimension table)
2. **Validate boundaries:** Check all coordinates fall within declared boundary box — report any violations as blocking errors
3. **Validate connectivity:** Ensure no floating nodes (every node has at least one edge)
4. **Validate uniqueness:** Check for duplicate node IDs — report as blocking errors
5. **Mark entry/exit:** Confirm at least one entry node and one exit node are marked
6. **Run gate script:** Execute `python scripts/verify_navigation_graph.py --skip-if-empty` — hard stop if non-zero
7. **Write output:** Save structured JSON to `agents/wayfinding/layout_parser/output/schema.json`

## Definition of Done (DoD)

- `scripts/verify_navigation_graph.py` exits 0 on the output file
- All coordinate values are within declared boundary box
- No duplicate node IDs exist
- At least one entry node and one exit node are marked
- SQLAlchemy model definitions are produced for `Layout` and `Shelf` entities
```

- [ ] **Step 2: Create Routing Logic CLAUDE.md**

Create `agents/wayfinding/routing_logic/CLAUDE.md` with this exact content:

```markdown
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
    {"from": "node-1", "to": "node-5", "distance_m": 12.4, "estimated_seconds": 15},
    {"from": "node-5", "to": "node-8", "distance_m": 7.2, "estimated_seconds": 9}
  ],
  "total_distance_m": 19.6,
  "total_estimated_seconds": 24
}
```

## Automated Execution Workflow

1. **Gate check:** Run `python scripts/verify_navigation_graph.py` — abort immediately if non-zero
2. **Load graph:** Parse `agents/wayfinding/layout_parser/output/schema.json` into a networkx DiGraph
3. **Snap coordinates:** Map each product location to the nearest navigable node
4. **Order stops:** Apply nearest-neighbor heuristic for multi-stop ordering (matches MappedIn benchmark behaviour)
5. **Calculate paths:** Run Dijkstra's algorithm with accessibility weighting between each consecutive stop pair
6. **Format output:** Build routing segments with `distance_m` and `estimated_seconds` per segment
7. **Write output:** Save to `agents/wayfinding/routing_logic/output/routing_output.json`

## Definition of Done (DoD)

- Output JSON contains both `waypoints` and `segments` keys with at least one entry each
- All waypoint node IDs exist in the validated input graph
- `total_distance_m` equals the sum of all segment `distance_m` values
- Route visits all requested product nodes
- `scripts/verify_navigation_graph.py` exits 0 before any calculation begins
```

- [ ] **Step 3: Create UI Generator CLAUDE.md**

Create `agents/wayfinding/ui_generator/CLAUDE.md` with this exact content:

```markdown
# Agent Context: UI Generator

## Role Scope

You are the UI Generator Agent. You translate routing output into React Native wayfinding UI components. Your visual and interaction benchmark is the [MappedIn grocery store demo](https://app.mappedin.com/map/6679882a8298d5000b85ee89?floor=m_f62f718116360827) — parity is required for control placement, route legibility, and step guidance progression.

## Technical & Tooling Stack

- **Framework:** React Native + Expo
- **Styling:** NativeWind (Tailwind CSS for RN)
- **State:** Zustand navigation store slice
- **Data fetching:** TanStack Query
- **Output path:** `client/src/components/wayfinding/`

## System Boundaries & Guidelines

1. **Token system loyalty:** Only use colors, spacing, and typography from `agents/ux_design/design_tokens.json`. Never invent one-off values.
2. **No routing logic:** Do not implement pathfinding. Consume `agents/wayfinding/routing_logic/output/routing_output.json` as data only.
3. **MappedIn parity:** Control placement, route overlay, and step guidance must visually match the MappedIn grocery benchmark.
4. **Accessibility mandatory:** All interactive elements ≥ 44×44px touch target. All text meets WCAG 2.2 AA contrast.
5. **Gate check first:** Run `python scripts/validate_agent_handoffs.py --stage routing-to-ui` before generating any code — hard stop if non-zero.

## Inputs

- Routing output: `agents/wayfinding/routing_logic/output/routing_output.json`
- Design tokens: `agents/ux_design/design_tokens.json`
- MappedIn visual benchmark (visual reference only — no runtime dependency)

## Navigation State Machine

```
idle ──(start navigation)──▶ routing ──(arrived)──▶ arrived
  ▲                               │
  └───────(cancel)────────────────┘
```

## Core Components to Generate

| Component | Responsibility |
|---|---|
| `WayfindingCanvas.tsx` | Indoor map SVG canvas with route overlay |
| `WayfindingControls.tsx` | Floating recenter, zoom-in, zoom-out buttons (MappedIn-benchmarked placement) |
| `WayfindingStepList.tsx` | FlatList of navigation steps, active step highlighted |
| `WayfindingFAB.tsx` | 56px circular floating action button to start navigation (Green Accent `#00754A`) |

## Non-Negotiable Constraints

- Canvas background: `#f2f0eb` (Neutral Warm) — never pure white
- Step list: `FlatList` only — never `ScrollView`
- Touch targets: minimum 44×44px on all interactive elements
- Colors and spacing: design tokens only — no hardcoded values
- No routing logic in component code

## Automated Execution Workflow

1. **Gate check:** `python scripts/validate_agent_handoffs.py --stage routing-to-ui` — hard stop if non-zero
2. **Load tokens:** Parse `agents/ux_design/design_tokens.json`
3. **Load routing data:** Parse `agents/wayfinding/routing_logic/output/routing_output.json`
4. **Reference benchmark:** Check MappedIn demo for control placement and route legibility
5. **Scaffold components:** Generate the 4 core components into `client/src/components/wayfinding/`
6. **Implement state:** Add Zustand store slice for `idle | routing | arrived` navigation states

## Definition of Done (DoD)

- `scripts/validate_agent_handoffs.py --stage routing-to-ui` exits 0 before any output is generated
- All 4 core components exist in `client/src/components/wayfinding/`
- `FlatList` used for `WayfindingStepList` — never `ScrollView`
- All touch targets ≥ 44×44px
- Canvas background is `#f2f0eb`
- Navigation state machine covers idle, routing, and arrived states
- No hardcoded color or spacing values — all reference design tokens
```

- [ ] **Step 4: Commit**

```bash
git add agents/wayfinding/
git commit -m "feat: add wayfinding agent cluster CLAUDE.md files

- Layout Parser Agent: coordinate ingestion and schema transformation
- Routing Logic Agent: Dijkstra/A* pathfinding with networkx
- UI Generator Agent: React Native wayfinding components, MappedIn benchmark"
```

---

## Task 3: Project Skill Files (`.claude/commands/`)

**Files:**
- Create: `.claude/commands/map-coordinate-transformer.md`
- Create: `.claude/commands/pathfinder-dijkstra-calc.md`
- Create: `.claude/commands/waypoint-rn-ui.md`

- [ ] **Step 1: Create map-coordinate-transformer skill**

Create `.claude/commands/map-coordinate-transformer.md`:

```markdown
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
```

- [ ] **Step 2: Create pathfinder-dijkstra-calc skill**

Create `.claude/commands/pathfinder-dijkstra-calc.md`:

```markdown
---
name: pathfinder-dijkstra-calc
description: Activates the Routing Logic Agent to calculate shortest-path grocery navigation routes using Dijkstra/A* with accessibility weighting, benchmarked against MappedIn multi-stop ordering behaviour.
---

# Routing Logic Agent

You are now operating as the **Routing Logic Agent**. Before taking any action, read `agents/wayfinding/routing_logic/CLAUDE.md` in full.

## Mandatory pre-flight

1. Read `agents/wayfinding/routing_logic/CLAUDE.md` completely
2. **Run** `python scripts/verify_navigation_graph.py` — **hard stop immediately** if exit code is non-zero. Do not attempt routing calculations on an invalid graph.
3. Confirm `agents/wayfinding/layout_parser/output/schema.json` exists

## Workflow

1. **Load** validated node graph from `agents/wayfinding/layout_parser/output/schema.json`
2. **Build** networkx DiGraph from nodes and edges
3. **Snap** product locations to the nearest navigable node
4. **Order stops** using nearest-neighbor heuristic (MappedIn benchmark: efficient multi-stop ordering)
5. **Calculate** Dijkstra's shortest path with accessibility weighting between each consecutive stop pair
6. **Format** output with `waypoints`, `segments`, `total_distance_m`, and `total_estimated_seconds`
7. **Write** output to `agents/wayfinding/routing_logic/output/routing_output.json`

## Hard boundaries

- Do NOT generate UI code or touch frontend components
- Do NOT make database calls or modify persisted data
- Do NOT produce partial routes — return complete route or explicit error
- Do NOT begin calculations if `verify_navigation_graph.py` exits non-zero
```

- [ ] **Step 3: Create waypoint-rn-ui skill**

Create `.claude/commands/waypoint-rn-ui.md`:

```markdown
---
name: waypoint-rn-ui
description: Activates the UI Generator Agent to build React Native wayfinding components (map canvas, route overlay, step list, map controls) from routing output, benchmarked against the MappedIn grocery store demo visual layout.
---

# UI Generator Agent

You are now operating as the **UI Generator Agent**. Before taking any action, read both `agents/wayfinding/ui_generator/CLAUDE.md` and `agents/ux_design/CLAUDE.md` in full.

## Mandatory pre-flight

1. Read `agents/wayfinding/ui_generator/CLAUDE.md` completely
2. Read `agents/ux_design/CLAUDE.md` completely
3. **Run** `python scripts/validate_agent_handoffs.py --stage routing-to-ui` — **hard stop** if exit code is non-zero. Routing Logic output must exist and be valid before any UI is generated.
4. Load `agents/ux_design/design_tokens.json` — all color and spacing values come from here only

## Workflow

1. **Confirm** `agents/wayfinding/routing_logic/output/routing_output.json` contains `waypoints` and `segments` keys
2. **Reference** [MappedIn grocery demo](https://app.mappedin.com/map/6679882a8298d5000b85ee89?floor=m_f62f718116360827) for control placement and route legibility benchmarks
3. **Generate** 4 core components into `client/src/components/wayfinding/`:
   - `WayfindingCanvas.tsx` — indoor map SVG canvas with route overlay
   - `WayfindingControls.tsx` — floating recenter, zoom-in, zoom-out (MappedIn placement)
   - `WayfindingStepList.tsx` — FlatList of navigation steps, active step highlighted
   - `WayfindingFAB.tsx` — 56px circular FAB (Green Accent `#00754A`)
4. **Implement** Zustand store slice: `idle → routing → arrived` state machine
5. **Verify** all constraints before declaring done (see CLAUDE.md DoD)

## Non-negotiable constraints

- Canvas background: `#f2f0eb` — never pure white
- Step list: `FlatList` only — never `ScrollView`
- Touch targets: minimum 44×44px on all interactive elements
- All values from design tokens only — no hardcoded colors or spacing
- No pathfinding logic in component code

## Hard boundaries

- Do NOT implement routing algorithms
- Do NOT deviate from UX Design Agent tokens without explicit user approval
- Do NOT write output until `validate_agent_handoffs.py --stage routing-to-ui` exits 0
```

- [ ] **Step 4: Commit**

```bash
git add .claude/commands/
git commit -m "feat: add wayfinding project slash command skills

- /map-coordinate-transformer: Layout Parser Agent activation
- /pathfinder-dijkstra-calc: Routing Logic Agent activation
- /waypoint-rn-ui: UI Generator Agent activation
Each skill enforces mandatory pre-flight validation gate checks"
```

---

## Task 4: Test Scaffold and conftest

**Files:**
- Create: `tests/conftest.py`
- Create: `tests/__init__.py`

- [ ] **Step 1: Create conftest.py**

Create `tests/conftest.py`:

```python
import sys
from pathlib import Path

# Make scripts/ importable from all tests
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
```

- [ ] **Step 2: Create __init__.py**

```bash
touch tests/__init__.py
```

- [ ] **Step 3: Verify pytest discovers the tests directory**

```bash
pip install pytest --quiet
pytest tests/ --collect-only
```

Expected output: `no tests ran` (no test files yet — that's correct at this step).

- [ ] **Step 4: Commit**

```bash
git add tests/
git commit -m "chore: add pytest test scaffold and conftest path setup"
```

---

## Task 5: `verify_navigation_graph.py` (TDD)

**Files:**
- Create: `tests/test_verify_navigation_graph.py`
- Create: `scripts/verify_navigation_graph.py`

- [ ] **Step 1: Write the failing tests**

Create `tests/test_verify_navigation_graph.py`:

```python
import pytest
from verify_navigation_graph import validate_graph

# Minimal valid graph used as the passing baseline across all tests
VALID_GRAPH = {
    "nodes": [
        {"id": "node-1", "type": "entry", "coordinates": {"x": 0, "y": 0}},
        {"id": "node-2", "type": "shelf", "coordinates": {"x": 10, "y": 10}},
        {"id": "node-3", "type": "exit", "coordinates": {"x": 20, "y": 0}},
    ],
    "edges": [
        {"from": "node-1", "to": "node-2"},
        {"from": "node-2", "to": "node-3"},
    ],
    "bounds": {"min_x": 0, "max_x": 100, "min_y": 0, "max_y": 100},
}


def test_valid_graph_returns_no_errors():
    # Arrange + Act
    errors = validate_graph(VALID_GRAPH)
    # Assert
    assert errors == []


def test_floating_node_is_detected():
    # Arrange — node-4 has no edges
    graph = {
        **VALID_GRAPH,
        "nodes": VALID_GRAPH["nodes"] + [
            {"id": "node-4", "type": "shelf", "coordinates": {"x": 50, "y": 50}}
        ],
    }
    # Act
    errors = validate_graph(graph)
    # Assert
    assert any("node-4" in e and "Floating" in e for e in errors)


def test_duplicate_node_id_is_detected():
    # Arrange — node-1 appears twice
    graph = {
        **VALID_GRAPH,
        "nodes": VALID_GRAPH["nodes"] + [
            {"id": "node-1", "type": "shelf", "coordinates": {"x": 5, "y": 5}}
        ],
    }
    # Act
    errors = validate_graph(graph)
    # Assert
    assert any("node-1" in e and "Duplicate" in e for e in errors)


def test_out_of_bounds_coordinate_is_detected():
    # Arrange — node-5 is outside bounds (max_x=100)
    graph = {
        **VALID_GRAPH,
        "nodes": VALID_GRAPH["nodes"] + [
            {"id": "node-5", "type": "shelf", "coordinates": {"x": 200, "y": 50}}
        ],
        "edges": VALID_GRAPH["edges"] + [{"from": "node-1", "to": "node-5"}],
    }
    # Act
    errors = validate_graph(graph)
    # Assert
    assert any("node-5" in e and "bounds" in e for e in errors)


def test_missing_entry_exit_node_is_detected():
    # Arrange — all nodes are type "shelf"
    graph = {
        **VALID_GRAPH,
        "nodes": [
            {"id": "node-1", "type": "shelf", "coordinates": {"x": 0, "y": 0}},
            {"id": "node-2", "type": "shelf", "coordinates": {"x": 10, "y": 0}},
        ],
        "edges": [{"from": "node-1", "to": "node-2"}],
    }
    # Act
    errors = validate_graph(graph)
    # Assert
    assert any("entry" in e.lower() or "exit" in e.lower() for e in errors)


def test_disconnected_subgraph_is_detected():
    # Arrange — node-c has no path to node-a or node-b
    graph = {
        "nodes": [
            {"id": "a", "type": "entry", "coordinates": {"x": 0, "y": 0}},
            {"id": "b", "type": "exit", "coordinates": {"x": 10, "y": 0}},
            {"id": "c", "type": "shelf", "coordinates": {"x": 50, "y": 50}},
            {"id": "d", "type": "shelf", "coordinates": {"x": 60, "y": 50}},
        ],
        "edges": [
            {"from": "a", "to": "b"},
            {"from": "c", "to": "d"},  # isolated island
        ],
        "bounds": {"min_x": 0, "max_x": 100, "min_y": 0, "max_y": 100},
    }
    # Act
    errors = validate_graph(graph)
    # Assert
    assert any("Unreachable" in e for e in errors)


def test_skip_if_empty_passes_on_empty_node_list():
    # Arrange
    graph = {"nodes": [], "edges": [], "bounds": {"min_x": 0, "max_x": 100, "min_y": 0, "max_y": 100}}
    # Act
    errors = validate_graph(graph, skip_if_empty=True)
    # Assert
    assert errors == []


def test_empty_graph_without_skip_flag_fails_on_missing_entry_exit():
    # Arrange
    graph = {"nodes": [], "edges": [], "bounds": {"min_x": 0, "max_x": 100, "min_y": 0, "max_y": 100}}
    # Act
    errors = validate_graph(graph, skip_if_empty=False)
    # Assert
    assert any("entry" in e.lower() or "exit" in e.lower() for e in errors)
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pytest tests/test_verify_navigation_graph.py -v
```

Expected: `ImportError: No module named 'verify_navigation_graph'` — confirming the tests are wired correctly and the implementation is missing.

- [ ] **Step 3: Write the implementation**

Create `scripts/verify_navigation_graph.py`:

```python
#!/usr/bin/env python3
"""
Validates the mathematical integrity of the store navigation graph.
Exits 0 on success, 1 on failure.

Usage:
    python scripts/verify_navigation_graph.py [graph_path] [--skip-if-empty]
"""
import argparse
import json
import sys
from collections import deque
from pathlib import Path


# ---------------------------------------------------------------------------
# Pure validation functions (importable for testing)
# ---------------------------------------------------------------------------

def _check_no_duplicate_ids(nodes: list[dict]) -> list[str]:
    seen: set[str] = set()
    errors: list[str] = []
    for node in nodes:
        node_id = node["id"]
        if node_id in seen:
            errors.append(f"Duplicate node ID: {node_id}")
        seen.add(node_id)
    return errors


def _check_no_floating_nodes(nodes: list[dict], edges: list[dict]) -> list[str]:
    connected: set[str] = set()
    for edge in edges:
        connected.add(edge["from"])
        connected.add(edge["to"])
    return [
        f"Floating node: {n['id']} at {n.get('coordinates', {})}"
        for n in nodes
        if n["id"] not in connected
    ]


def _check_coordinates_in_bounds(nodes: list[dict], bounds: dict) -> list[str]:
    errors: list[str] = []
    for node in nodes:
        coords = node.get("coordinates", {})
        x = coords.get("x", 0)
        y = coords.get("y", 0)
        in_x = bounds["min_x"] <= x <= bounds["max_x"]
        in_y = bounds["min_y"] <= y <= bounds["max_y"]
        if not (in_x and in_y):
            errors.append(
                f"Node {node['id']} out of bounds: ({x}, {y}) — "
                f"bounds are x[{bounds['min_x']}, {bounds['max_x']}] "
                f"y[{bounds['min_y']}, {bounds['max_y']}]"
            )
    return errors


def _check_entry_exit_nodes(nodes: list[dict]) -> list[str]:
    types = {n.get("type") for n in nodes}
    errors: list[str] = []
    if "entry" not in types:
        errors.append("No entry node defined — at least one node must have type 'entry'")
    if "exit" not in types:
        errors.append("No exit node defined — at least one node must have type 'exit'")
    return errors


def _check_fully_connected(nodes: list[dict], edges: list[dict]) -> list[str]:
    if not nodes:
        return []

    # Build undirected adjacency list
    graph: dict[str, list[str]] = {n["id"]: [] for n in nodes}
    for edge in edges:
        graph[edge["from"]].append(edge["to"])
        graph[edge["to"]].append(edge["from"])

    # BFS from the first node
    start = nodes[0]["id"]
    visited: set[str] = {start}
    queue: deque[str] = deque([start])
    while queue:
        current = queue.popleft()
        for neighbour in graph.get(current, []):
            if neighbour not in visited:
                visited.add(neighbour)
                queue.append(neighbour)

    all_ids = {n["id"] for n in nodes}
    unreachable = all_ids - visited
    return [f"Unreachable node: {node_id}" for node_id in sorted(unreachable)]


def validate_graph(graph_data: dict, skip_if_empty: bool = False) -> list[str]:
    """
    Validate the navigation graph and return a list of error strings.
    Returns an empty list if the graph is valid.
    """
    nodes: list[dict] = graph_data.get("nodes", [])
    edges: list[dict] = graph_data.get("edges", [])
    bounds: dict = graph_data.get(
        "bounds", {"min_x": 0, "max_x": 1000, "min_y": 0, "max_y": 1000}
    )

    if not nodes and skip_if_empty:
        return []

    errors: list[str] = []
    errors.extend(_check_no_duplicate_ids(nodes))
    errors.extend(_check_no_floating_nodes(nodes, edges))
    errors.extend(_check_coordinates_in_bounds(nodes, bounds))
    errors.extend(_check_entry_exit_nodes(nodes))
    errors.extend(_check_fully_connected(nodes, edges))
    return errors


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate store navigation graph integrity"
    )
    parser.add_argument(
        "graph_path",
        nargs="?",
        default="agents/wayfinding/layout_parser/output/schema.json",
        help="Path to navigation graph JSON file",
    )
    parser.add_argument(
        "--skip-if-empty",
        action="store_true",
        help="Pass gracefully when graph file does not exist or contains no nodes",
    )
    args = parser.parse_args()

    graph_path = Path(args.graph_path)

    if not graph_path.exists():
        if args.skip_if_empty:
            print("✅ No graph file found — skipping (--skip-if-empty)")
            sys.exit(0)
        print(f"❌ Graph file not found: {graph_path}")
        sys.exit(1)

    with open(graph_path) as f:
        graph_data = json.load(f)

    errors = validate_graph(graph_data, skip_if_empty=args.skip_if_empty)

    if errors:
        print("❌ Navigation graph validation failed:")
        for error in errors:
            print(f"  - {error}")
        sys.exit(1)

    print("✅ Navigation graph is valid")
    sys.exit(0)


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pytest tests/test_verify_navigation_graph.py -v
```

Expected output:
```
PASSED tests/test_verify_navigation_graph.py::test_valid_graph_returns_no_errors
PASSED tests/test_verify_navigation_graph.py::test_floating_node_is_detected
PASSED tests/test_verify_navigation_graph.py::test_duplicate_node_id_is_detected
PASSED tests/test_verify_navigation_graph.py::test_out_of_bounds_coordinate_is_detected
PASSED tests/test_verify_navigation_graph.py::test_missing_entry_exit_node_is_detected
PASSED tests/test_verify_navigation_graph.py::test_disconnected_subgraph_is_detected
PASSED tests/test_verify_navigation_graph.py::test_skip_if_empty_passes_on_empty_node_list
PASSED tests/test_verify_navigation_graph.py::test_empty_graph_without_skip_flag_fails_on_missing_entry_exit
8 passed in 0.XXs
```

- [ ] **Step 5: Commit**

```bash
git add tests/test_verify_navigation_graph.py scripts/verify_navigation_graph.py
git commit -m "feat: add verify_navigation_graph.py with full test coverage

Validates: no duplicate IDs, no floating nodes, coordinates in bounds,
entry/exit nodes present, graph fully connected. Supports --skip-if-empty
flag for graceful CI pass during early development."
```

---

## Task 6: `validate_api_contract.py` (TDD)

**Files:**
- Create: `tests/test_validate_api_contract.py`
- Create: `scripts/validate_api_contract.py`

- [ ] **Step 1: Write the failing tests**

Create `tests/test_validate_api_contract.py`:

```python
import pytest
from validate_api_contract import validate_spec

VALID_SPEC = """
# API Endpoint Specifications (v1 Contract)

## 1. Layouts

- **GET /layouts** -> Returns a list of all layouts.
- **POST /layouts** -> Creates a new layout.
- **DELETE /layouts/:id** -> Destroys layout.

## 2. Shelves

- **GET /shelves** -> List all active shelves.
- **POST /shelves** -> Create a shelf.

## 3. Products

- **GET /products** -> Fetch complete inventory tracking data.
- **POST /products** -> Register an item type.
"""

SPEC_MISSING_PRODUCTS = """
# API Endpoint Specifications (v1 Contract)

## 1. Layouts

- **GET /layouts** -> Returns a list of all layouts.

## 2. Shelves

- **GET /shelves** -> List all active shelves.
"""

SPEC_MISSING_SHELVES = """
# API Endpoint Specifications (v1 Contract)

## 1. Layouts

- **GET /layouts** -> Returns a list of all layouts.

## 3. Products

- **GET /products** -> Fetch complete inventory tracking data.
"""

SPEC_ENDPOINT_WITHOUT_DESCRIPTION = """
# API Endpoint Specifications (v1 Contract)

## 1. Layouts

- **GET /layouts** ->

## 2. Shelves

- **GET /shelves** -> List all active shelves.

## 3. Products

- **GET /products** -> Fetch complete inventory tracking data.
"""

SPEC_NO_ENDPOINTS = """
# API Endpoint Specifications (v1 Contract)

## 1. Layouts

Some prose with no endpoint definitions.

## 2. Shelves

More prose.

## 3. Products

Even more prose.
"""


def test_valid_spec_returns_no_errors():
    # Arrange + Act
    errors = validate_spec(VALID_SPEC)
    # Assert
    assert errors == []


def test_missing_products_section_is_detected():
    # Arrange + Act
    errors = validate_spec(SPEC_MISSING_PRODUCTS)
    # Assert
    assert any("Products" in e for e in errors)


def test_missing_shelves_section_is_detected():
    # Arrange + Act
    errors = validate_spec(SPEC_MISSING_SHELVES)
    # Assert
    assert any("Shelves" in e for e in errors)


def test_endpoint_without_description_is_detected():
    # Arrange + Act
    errors = validate_spec(SPEC_ENDPOINT_WITHOUT_DESCRIPTION)
    # Assert
    assert any("description" in e.lower() and "/layouts" in e for e in errors)


def test_spec_with_no_parseable_endpoints_is_detected():
    # Arrange + Act
    errors = validate_spec(SPEC_NO_ENDPOINTS)
    # Assert
    assert any("No endpoints found" in e for e in errors)
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pytest tests/test_validate_api_contract.py -v
```

Expected: `ImportError: No module named 'validate_api_contract'`

- [ ] **Step 3: Write the implementation**

Create `scripts/validate_api_contract.py`:

```python
#!/usr/bin/env python3
"""
Validates server/api-spec.md for completeness.
Exits 0 on success, 1 on failure.

Note: does NOT cross-reference server/legacy/ — legacy code is reference only.

Usage:
    python scripts/validate_api_contract.py [spec_path]
"""
import argparse
import re
import sys
from pathlib import Path

REQUIRED_SECTIONS = ["Layouts", "Shelves", "Products"]

# Matches lines like: - **GET /layouts** -> description text
_ENDPOINT_PATTERN = re.compile(
    r"-\s+\*\*(GET|POST|PUT|DELETE|PATCH)\s+(/[^\*]+)\*\*\s*->\s*(.+)?"
)


# ---------------------------------------------------------------------------
# Pure validation functions (importable for testing)
# ---------------------------------------------------------------------------

def _check_required_sections(content: str) -> list[str]:
    return [
        f"Missing required section: {section}"
        for section in REQUIRED_SECTIONS
        if section not in content
    ]


def _extract_endpoints(content: str) -> list[dict]:
    endpoints = []
    for match in _ENDPOINT_PATTERN.finditer(content):
        endpoints.append(
            {
                "method": match.group(1),
                "path": match.group(2).strip(),
                "description": (match.group(3) or "").strip(),
            }
        )
    return endpoints


def _check_endpoints_have_descriptions(endpoints: list[dict]) -> list[str]:
    return [
        f"Endpoint {ep['method']} {ep['path']} has no description"
        for ep in endpoints
        if not ep["description"]
    ]


def validate_spec(content: str) -> list[str]:
    """
    Validate the API spec markdown content.
    Returns a list of error strings; empty list means valid.
    """
    errors: list[str] = []
    errors.extend(_check_required_sections(content))

    endpoints = _extract_endpoints(content)
    if not endpoints:
        errors.append(
            "No endpoints found in spec — check formatting. "
            "Expected format: - **GET /path** -> description"
        )
        return errors

    errors.extend(_check_endpoints_have_descriptions(endpoints))
    return errors


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate server/api-spec.md for completeness"
    )
    parser.add_argument(
        "spec_path",
        nargs="?",
        default="server/api-spec.md",
        help="Path to the API spec markdown file",
    )
    args = parser.parse_args()

    spec_path = Path(args.spec_path)
    if not spec_path.exists():
        print(f"❌ API spec not found: {spec_path}")
        sys.exit(1)

    content = spec_path.read_text(encoding="utf-8")
    errors = validate_spec(content)

    if errors:
        print("❌ API contract validation failed:")
        for error in errors:
            print(f"  - {error}")
        sys.exit(1)

    print("✅ API contract is valid")
    sys.exit(0)


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pytest tests/test_validate_api_contract.py -v
```

Expected output:
```
PASSED tests/test_validate_api_contract.py::test_valid_spec_returns_no_errors
PASSED tests/test_validate_api_contract.py::test_missing_products_section_is_detected
PASSED tests/test_validate_api_contract.py::test_missing_shelves_section_is_detected
PASSED tests/test_validate_api_contract.py::test_endpoint_without_description_is_detected
PASSED tests/test_validate_api_contract.py::test_spec_with_no_parseable_endpoints_is_detected
5 passed in 0.XXs
```

- [ ] **Step 5: Commit**

```bash
git add tests/test_validate_api_contract.py scripts/validate_api_contract.py
git commit -m "feat: add validate_api_contract.py with full test coverage

Validates required sections (Layouts, Shelves, Products), endpoint
format, and description presence. Does not cross-reference legacy code."
```

---

## Task 7: `validate_agent_handoffs.py` (TDD)

**Files:**
- Create: `tests/test_validate_agent_handoffs.py`
- Create: `scripts/validate_agent_handoffs.py`

- [ ] **Step 1: Write the failing tests**

Create `tests/test_validate_agent_handoffs.py`:

```python
import json
import pytest
from pathlib import Path
from validate_agent_handoffs import (
    check_pm_to_ux,
    check_ux_to_client,
    check_layout_to_routing,
    check_routing_to_ui,
)


# ---------------------------------------------------------------------------
# check_pm_to_ux
# ---------------------------------------------------------------------------

def test_pm_to_ux_passes_when_story_file_exists(tmp_path, monkeypatch):
    # Arrange
    stories_dir = tmp_path / "agents" / "product_management" / "user_stories"
    stories_dir.mkdir(parents=True)
    (stories_dir / "story-001.md").write_text("# User Story 001")
    monkeypatch.chdir(tmp_path)
    # Act
    errors = check_pm_to_ux()
    # Assert
    assert errors == []


def test_pm_to_ux_fails_when_stories_dir_missing(tmp_path, monkeypatch):
    # Arrange — no user_stories directory at all
    monkeypatch.chdir(tmp_path)
    # Act
    errors = check_pm_to_ux()
    # Assert
    assert len(errors) == 1
    assert "user_stories" in errors[0]


def test_pm_to_ux_fails_when_stories_dir_empty(tmp_path, monkeypatch):
    # Arrange — directory exists but has no .md files
    stories_dir = tmp_path / "agents" / "product_management" / "user_stories"
    stories_dir.mkdir(parents=True)
    monkeypatch.chdir(tmp_path)
    # Act
    errors = check_pm_to_ux()
    # Assert
    assert len(errors) == 1
    assert "No user story files" in errors[0]


# ---------------------------------------------------------------------------
# check_ux_to_client
# ---------------------------------------------------------------------------

def test_ux_to_client_passes_when_all_artifacts_exist(tmp_path, monkeypatch):
    # Arrange
    specs_dir = tmp_path / "agents" / "ux_design" / "SPECS" / "CLIENT"
    specs_dir.mkdir(parents=True)
    (specs_dir / "client-specs.md").write_text("# Client Specs")
    tokens_path = tmp_path / "agents" / "ux_design" / "design_tokens.json"
    tokens_path.parent.mkdir(parents=True, exist_ok=True)
    tokens_path.write_text('{"color": {"primary": "#00754A"}}')
    monkeypatch.chdir(tmp_path)
    # Act
    errors = check_ux_to_client()
    # Assert
    assert errors == []


def test_ux_to_client_fails_when_tokens_empty(tmp_path, monkeypatch):
    # Arrange — specs exist but tokens file is empty
    specs_dir = tmp_path / "agents" / "ux_design" / "SPECS" / "CLIENT"
    specs_dir.mkdir(parents=True)
    (specs_dir / "client-specs.md").write_text("# Client Specs")
    tokens_path = tmp_path / "agents" / "ux_design" / "design_tokens.json"
    tokens_path.parent.mkdir(parents=True, exist_ok=True)
    tokens_path.write_text("")
    monkeypatch.chdir(tmp_path)
    # Act
    errors = check_ux_to_client()
    # Assert
    assert any("empty" in e.lower() for e in errors)


# ---------------------------------------------------------------------------
# check_layout_to_routing
# ---------------------------------------------------------------------------

def test_layout_to_routing_passes_when_schema_exists(tmp_path, monkeypatch):
    # Arrange
    output_dir = tmp_path / "agents" / "wayfinding" / "layout_parser" / "output"
    output_dir.mkdir(parents=True)
    (output_dir / "schema.json").write_text('{"nodes": [], "edges": []}')
    monkeypatch.chdir(tmp_path)
    # Act
    errors = check_layout_to_routing()
    # Assert
    assert errors == []


def test_layout_to_routing_fails_when_schema_missing(tmp_path, monkeypatch):
    # Arrange — output directory exists but no schema.json
    monkeypatch.chdir(tmp_path)
    # Act
    errors = check_layout_to_routing()
    # Assert
    assert len(errors) == 1
    assert "Layout Parser output not found" in errors[0]


def test_layout_to_routing_accepts_custom_output_path(tmp_path, monkeypatch):
    # Arrange
    custom_schema = tmp_path / "custom_schema.json"
    custom_schema.write_text('{"nodes": [], "edges": []}')
    monkeypatch.chdir(tmp_path)
    # Act
    errors = check_layout_to_routing(output_path=str(custom_schema))
    # Assert
    assert errors == []


# ---------------------------------------------------------------------------
# check_routing_to_ui
# ---------------------------------------------------------------------------

def test_routing_to_ui_passes_with_valid_output(tmp_path, monkeypatch):
    # Arrange
    output_dir = tmp_path / "agents" / "wayfinding" / "routing_logic" / "output"
    output_dir.mkdir(parents=True)
    routing_output = {
        "waypoints": ["node-1", "node-2"],
        "segments": [{"from": "node-1", "to": "node-2", "distance_m": 5.0, "estimated_seconds": 6}],
        "total_distance_m": 5.0,
        "total_estimated_seconds": 6,
    }
    (output_dir / "routing_output.json").write_text(json.dumps(routing_output))
    monkeypatch.chdir(tmp_path)
    # Act
    errors = check_routing_to_ui()
    # Assert
    assert errors == []


def test_routing_to_ui_fails_when_output_missing(tmp_path, monkeypatch):
    # Arrange — no routing output file
    monkeypatch.chdir(tmp_path)
    # Act
    errors = check_routing_to_ui()
    # Assert
    assert len(errors) == 1
    assert "not found" in errors[0]


def test_routing_to_ui_fails_when_waypoints_key_missing(tmp_path, monkeypatch):
    # Arrange — output exists but missing 'waypoints'
    output_dir = tmp_path / "agents" / "wayfinding" / "routing_logic" / "output"
    output_dir.mkdir(parents=True)
    (output_dir / "routing_output.json").write_text(
        json.dumps({"segments": [{"from": "a", "to": "b", "distance_m": 1.0, "estimated_seconds": 2}]})
    )
    monkeypatch.chdir(tmp_path)
    # Act
    errors = check_routing_to_ui()
    # Assert
    assert any("waypoints" in e for e in errors)


def test_routing_to_ui_fails_when_segments_key_missing(tmp_path, monkeypatch):
    # Arrange — output exists but missing 'segments'
    output_dir = tmp_path / "agents" / "wayfinding" / "routing_logic" / "output"
    output_dir.mkdir(parents=True)
    (output_dir / "routing_output.json").write_text(
        json.dumps({"waypoints": ["node-1"]})
    )
    monkeypatch.chdir(tmp_path)
    # Act
    errors = check_routing_to_ui()
    # Assert
    assert any("segments" in e for e in errors)


def test_routing_to_ui_fails_when_output_is_invalid_json(tmp_path, monkeypatch):
    # Arrange
    output_dir = tmp_path / "agents" / "wayfinding" / "routing_logic" / "output"
    output_dir.mkdir(parents=True)
    (output_dir / "routing_output.json").write_text("not valid json {{{")
    monkeypatch.chdir(tmp_path)
    # Act
    errors = check_routing_to_ui()
    # Assert
    assert any("JSON" in e for e in errors)
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pytest tests/test_validate_agent_handoffs.py -v
```

Expected: `ImportError: No module named 'validate_agent_handoffs'`

- [ ] **Step 3: Write the implementation**

Create `scripts/validate_agent_handoffs.py`:

```python
#!/usr/bin/env python3
"""
Validates that mandatory handoff artifacts exist between agent stages.
Exits 0 on success, 1 on failure.

Usage:
    python scripts/validate_agent_handoffs.py --stage routing-to-ui
    python scripts/validate_agent_handoffs.py --stage all
    python scripts/validate_agent_handoffs.py --stage layout-to-routing --output-path path/to/schema.json
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# Individual stage checkers (importable for testing)
# ---------------------------------------------------------------------------

def check_pm_to_ux() -> list[str]:
    stories_path = Path("agents/product_management/user_stories")
    if not stories_path.exists():
        return [
            "agents/product_management/user_stories/ directory does not exist — "
            "Product Management Agent must create at least one user story before UX begins"
        ]
    md_files = list(stories_path.glob("*.md"))
    if not md_files:
        return [
            "No user story files found in agents/product_management/user_stories/ — "
            "create at least one .md story file before handing off to UX Design"
        ]
    return []


def check_ux_to_client() -> list[str]:
    errors: list[str] = []

    specs_path = Path("agents/ux_design/SPECS")
    if not specs_path.exists():
        errors.append(
            "agents/ux_design/SPECS/ directory does not exist — "
            "UX Design Agent must produce spec files before Client begins"
        )
    else:
        spec_files = list(specs_path.rglob("*-specs.md"))
        if not spec_files:
            errors.append(
                "No *-specs.md files found in agents/ux_design/SPECS/ — "
                "UX Design Agent must produce at least one spec file"
            )

    tokens_path = Path("agents/ux_design/design_tokens.json")
    if not tokens_path.exists():
        errors.append("agents/ux_design/design_tokens.json does not exist")
    elif tokens_path.stat().st_size == 0:
        errors.append(
            "agents/ux_design/design_tokens.json is empty — "
            "UX Design Agent must populate design tokens before Client begins"
        )

    return errors


def check_layout_to_routing(output_path: str | None = None) -> list[str]:
    path = (
        Path(output_path)
        if output_path
        else Path("agents/wayfinding/layout_parser/output/schema.json")
    )
    if not path.exists():
        return [
            f"Layout Parser output not found: {path} — "
            "run /map-coordinate-transformer before running /pathfinder-dijkstra-calc"
        ]
    return []


def check_routing_to_ui() -> list[str]:
    output_path = Path("agents/wayfinding/routing_logic/output/routing_output.json")
    if not output_path.exists():
        return [
            f"Routing Logic output not found: {output_path} — "
            "run /pathfinder-dijkstra-calc before running /waypoint-rn-ui"
        ]

    try:
        data = json.loads(output_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return [f"Routing output is not valid JSON: {exc}"]

    errors: list[str] = []
    if "waypoints" not in data:
        errors.append(
            "Routing output missing required key: 'waypoints' — "
            "re-run /pathfinder-dijkstra-calc to regenerate valid output"
        )
    if "segments" not in data:
        errors.append(
            "Routing output missing required key: 'segments' — "
            "re-run /pathfinder-dijkstra-calc to regenerate valid output"
        )
    return errors


def check_server_to_client() -> list[str]:
    result = subprocess.run(
        [sys.executable, "scripts/validate_api_contract.py"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return [f"API contract validation failed:\n    {result.stdout.strip()}"]
    return []


# ---------------------------------------------------------------------------
# Stage registry
# ---------------------------------------------------------------------------

_STAGES: dict[str, callable] = {
    "pm-to-ux": check_pm_to_ux,
    "ux-to-client": check_ux_to_client,
    "layout-to-routing": check_layout_to_routing,
    "routing-to-ui": check_routing_to_ui,
    "server-to-client": check_server_to_client,
}


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate agent handoff artifacts between pipeline stages"
    )
    parser.add_argument(
        "--stage",
        default="all",
        choices=[*_STAGES.keys(), "all"],
        help="Which handoff stage to validate (default: all)",
    )
    parser.add_argument(
        "--output-path",
        default=None,
        help="Custom schema output path for the layout-to-routing stage check",
    )
    args = parser.parse_args()

    stages_to_run = list(_STAGES.keys()) if args.stage == "all" else [args.stage]

    all_errors: list[tuple[str, list[str]]] = []
    for stage in stages_to_run:
        if stage == "layout-to-routing":
            errors = check_layout_to_routing(args.output_path)
        else:
            errors = _STAGES[stage]()

        if errors:
            all_errors.append((stage, errors))

    if all_errors:
        print("❌ Agent handoff validation failed:")
        for stage, errors in all_errors:
            print(f"\n  Stage [{stage}]:")
            for error in errors:
                print(f"    - {error}")
        sys.exit(1)

    stages_label = ", ".join(stages_to_run)
    print(f"✅ All handoff artifacts present ({stages_label})")
    sys.exit(0)


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pytest tests/test_validate_agent_handoffs.py -v
```

Expected output:
```
PASSED tests/test_validate_agent_handoffs.py::test_pm_to_ux_passes_when_story_file_exists
PASSED tests/test_validate_agent_handoffs.py::test_pm_to_ux_fails_when_stories_dir_missing
PASSED tests/test_validate_agent_handoffs.py::test_pm_to_ux_fails_when_stories_dir_empty
PASSED tests/test_validate_agent_handoffs.py::test_ux_to_client_passes_when_all_artifacts_exist
PASSED tests/test_validate_agent_handoffs.py::test_ux_to_client_fails_when_tokens_empty
PASSED tests/test_validate_agent_handoffs.py::test_layout_to_routing_passes_when_schema_exists
PASSED tests/test_validate_agent_handoffs.py::test_layout_to_routing_fails_when_schema_missing
PASSED tests/test_validate_agent_handoffs.py::test_layout_to_routing_accepts_custom_output_path
PASSED tests/test_validate_agent_handoffs.py::test_routing_to_ui_passes_with_valid_output
PASSED tests/test_validate_agent_handoffs.py::test_routing_to_ui_fails_when_output_missing
PASSED tests/test_validate_agent_handoffs.py::test_routing_to_ui_fails_when_waypoints_key_missing
PASSED tests/test_validate_agent_handoffs.py::test_routing_to_ui_fails_when_segments_key_missing
PASSED tests/test_validate_agent_handoffs.py::test_routing_to_ui_fails_when_output_is_invalid_json
13 passed in 0.XXs
```

- [ ] **Step 5: Run full test suite to confirm no regressions**

```bash
pytest tests/ -v
```

Expected: all 26 tests passing across the three test files.

- [ ] **Step 6: Commit**

```bash
git add tests/test_validate_agent_handoffs.py scripts/validate_agent_handoffs.py
git commit -m "feat: add validate_agent_handoffs.py with full test coverage

Validates pm-to-ux, ux-to-client, layout-to-routing, routing-to-ui,
and server-to-client handoff artifact presence. Supports --stage flag
and --output-path override for layout-to-routing. All 13 tests passing."
```

---

## Task 8: Update `server/CLAUDE.md` for Python + FastAPI

**Files:**
- Modify: `server/CLAUDE.md`

- [ ] **Step 1: Replace server/CLAUDE.md**

Overwrite `server/CLAUDE.md` with:

```markdown
# Agent Context: Backend Software Engineer

## Role Scope

You are the Backend Engineering Agent. You are responsible for server architecture, API design, database schema management, authentication services, and performance optimization.

For the first pass of backend development, refer to `./legacy/` to understand prior data shapes, entity relationships, and route patterns from the Node.js reference implementation. Adapt to Python + FastAPI idioms — do not port code 1:1. Ask clarifying questions before making structural decisions. (Disregard this paragraph for subsequent backend iterations.)

## Technical & Tooling Stack

- **Runtime & Framework:** Python 3.11+ + FastAPI
- **Validation:** Pydantic v2 (replaces Zod — all request/response shapes are Pydantic models)
- **ORM:** SQLAlchemy 2.0 (async) + Alembic for migrations
- **Database:** Supabase (PostgreSQL) via async SQLAlchemy engine
- **Caching:** Redis via `aioredis`
- **Authentication:** OAuth2 + JWT via `python-jose` / `fastapi-users`, role-based access control for admin routes
- **Security:** CORS middleware, `python-multipart` for form handling, `passlib[bcrypt]` for password hashing
- **Documentation:** FastAPI auto-generates `/docs` (Swagger UI) and `/redoc` — `server/api-spec.md` is the human-readable contract
- **Graph / Wayfinding:** `networkx` for Dijkstra/A* pathfinding in `services/navigation_service.py`
- **Email:** Resend Python SDK (contact form submissions)
- **Versioning:** All routes prefixed `/v1/` via `APIRouter(prefix="/v1")`

## Project Structure

```
server/
├── CLAUDE.md              ← this file
├── api-spec.md            ← human-readable API contract (update before implementing routes)
├── legacy/                ← Node.js reference implementation — read only, never modify
└── src/
    ├── main.py            ← FastAPI app entry point, router registration, middleware config
    ├── routers/           ← one file per resource: layouts.py, shelves.py, products.py, navigation.py
    ├── controllers/       ← input extraction and Pydantic validation only; delegates to services
    ├── services/          ← business logic; no direct DB access
    │   └── navigation_service.py  ← Dijkstra/A* via networkx, MappedIn-benchmarked
    ├── repositories/      ← async SQLAlchemy queries only; no business logic
    ├── models/            ← SQLAlchemy ORM models
    ├── schemas/           ← Pydantic request/response models
    └── utils/
        ├── auth.py        ← JWT + OAuth2 helpers
        ├── database.py    ← async engine + session factory (Supabase PostgreSQL)
        └── config.py      ← pydantic-settings for environment variable management
```

## System Boundaries & Guidelines

1. **API First:** Update `server/api-spec.md` before writing any route or repository code.
2. **Defensive Programming:** Treat all client inputs as hostile. All incoming data must pass through a Pydantic model before reaching service layer.
3. **Database Guardrails:** Never execute un-indexed queries. All schema changes use Alembic migration files.
4. **Wayfinding Benchmark:** The navigation service benchmarks against MappedIn wayfinding for route legibility, multi-stop ordering, and step guidance UX (https://developer.mappedin.com/docs/overview). MappedIn is a visual/interaction reference only — no runtime API dependency.
5. **Legacy Reference Policy:** `server/legacy/` is read-only reference for data shapes and route patterns. Never modify it. Never cross-reference it in validation scripts.

## Automated Execution Workflow

Implement in this incremental sequence to reduce bugs:

1. **Local, no API, no DB** — data models and Pydantic schemas only
2. **Local, API, no DB** — FastAPI routes returning hardcoded mock data
3. **Local, API, DB** — SQLAlchemy + Alembic migrations wired to local Supabase
4. **Cloud, API, DB** — deploy to cloud (Render/Railway — choose best free tier)
5. **Cloud, API, Auth, DB** — add JWT/OAuth2 and RBAC middleware

When processing feature assignments:
1. **Data Modeling:** Create or update Alembic migration files; run migrations
2. **API Endpoint Definition:** Stub controller routes and document in `server/api-spec.md`
3. **Business Logic:** Write services separating logic from infrastructure
4. **Unit Tests:** Write pytest tests alongside implementation code

## Definition of Done (DoD)

- Code passes mypy type checks and ruff linting with zero warnings
- API endpoints return appropriate HTTP status codes (200, 201, 400, 401, 403, 422, 500)
- Database queries do not cause N+1 bugs
- All new routes are documented in `server/api-spec.md` before merge
- FastAPI `/docs` reflects the current state of all routes
```

- [ ] **Step 2: Commit**

```bash
git add server/CLAUDE.md
git commit -m "feat: update server/CLAUDE.md for Python + FastAPI stack

Replaces Node.js/Express context with Python 3.11+/FastAPI, Pydantic v2,
SQLAlchemy 2.0 async, Alembic, aioredis. Preserves controller-service-
repository pattern and legacy read-only policy."
```

---

## Task 9: Update `CLAUDE.md` and `ARCHITECTURE.md`

**Files:**
- Modify: `CLAUDE.md`
- Modify: `ARCHITECTURE.md`

- [ ] **Step 1: Update the Tech Stack table in CLAUDE.md**

In `CLAUDE.md`, find the Tech Stack table and replace the Backend runtime, Validation, and ORM rows:

Find:
```
| Backend runtime     | Node.js + TypeScript + Express                                          |
| Validation          | Zod (all incoming inputs treated as hostile; parsed through middleware) |
| ORM                 | Prisma                                                                  |
```

Replace with:
```
| Backend runtime     | Python 3.11+ + FastAPI                                                  |
| Validation          | Pydantic v2 (all incoming inputs treated as hostile; parsed through Pydantic models) |
| ORM                 | SQLAlchemy 2.0 (async) + Alembic migrations                             |
```

- [ ] **Step 2: Update the Monorepo Structure tree in CLAUDE.md**

In `CLAUDE.md`, find the monorepo structure code block and add the new directories. Replace the `agents/` section:

Find:
```
├── agents/
│   ├── product_management/   # PM/PO agent — user stories, backlog, acceptance criteria
│   ├── ux_design/            # UX agent — flows, tokens, mobile-first specs, SPECS/ folder
│   ├── quality_assurance/    # QA agent — test plans, Arrange-Act-Assert scripts
│   └── devsecops/            # DevSecOps agent — CI/CD, secrets, mobile distribution
```

Replace with:
```
├── .claude/
│   └── commands/             # Project slash command skills (auto-loaded in Claude Code sessions)
│       ├── map-coordinate-transformer.md  # /map-coordinate-transformer → Layout Parser Agent
│       ├── pathfinder-dijkstra-calc.md    # /pathfinder-dijkstra-calc → Routing Logic Agent
│       └── waypoint-rn-ui.md             # /waypoint-rn-ui → UI Generator Agent
├── agents/
│   ├── product_management/   # PM/PO agent — user stories, backlog, acceptance criteria
│   ├── ux_design/            # UX agent — flows, tokens, mobile-first specs, SPECS/ folder
│   ├── quality_assurance/    # QA agent — test plans, Arrange-Act-Assert scripts
│   ├── devsecops/            # DevSecOps agent — CI/CD, secrets, mobile distribution
│   └── wayfinding/           # Wayfinding domain agent cluster
│       ├── layout_parser/    # Coordinate ingestion → SQLAlchemy schema models
│       ├── routing_logic/    # Dijkstra/A* pathfinding via networkx, MappedIn benchmark
│       └── ui_generator/     # React Native wayfinding components, MappedIn visual parity
```

Also add the `scripts/` and `tests/` directories to the tree after `server/`:

Find:
```
├── client/                   # React Native / Expo frontend
```

Replace with:
```
├── scripts/                  # Python validation gate scripts (CI-integrated)
│   ├── validate_api_contract.py      # Validates server/api-spec.md completeness
│   ├── validate_agent_handoffs.py    # Validates handoff artifacts between agent stages
│   └── verify_navigation_graph.py   # Validates navigation graph integrity (no floating nodes)
├── tests/                    # Pytest test suite for validation scripts
├── client/                   # React Native / Expo frontend
```

- [ ] **Step 3: Update the Wayfinding Integration section in CLAUDE.md**

Find:
```
### Wayfinding Integration

Indoor navigation uses the **MappedIn API**.
```

Replace with:
```
### Wayfinding Integration

Indoor navigation is implemented with this project's own code. MappedIn is a **visual and interaction benchmark only** — no runtime API dependency.
```

- [ ] **Step 4: Update the Agent Registry table in CLAUDE.md**

Find the Agent Registry table and add the three wayfinding agents as rows:

Find:
```
| DevSecOps | CI/CD, secrets strategy, security scanning gates, deployment controls | `agents/devsecops/CLAUDE.md` |
```

Replace with:
```
| DevSecOps | CI/CD, secrets strategy, security scanning gates, deployment controls | `agents/devsecops/CLAUDE.md` |
| Layout Parser | Coordinate map ingestion, grid-to-schema transformation, anchor validation | `agents/wayfinding/layout_parser/CLAUDE.md` |
| Routing Logic | Dijkstra/A* pathfinding, multi-stop ordering, accessibility weighting | `agents/wayfinding/routing_logic/CLAUDE.md` |
| UI Generator | React Native wayfinding components, MappedIn-benchmarked visual parity | `agents/wayfinding/ui_generator/CLAUDE.md` |
```

- [ ] **Step 5: Update ARCHITECTURE.md**

Open `ARCHITECTURE.md` and append the following section at the end:

```markdown

## Updated Folder Structure (v2)

The following directories were added in the multi-agent orchestration restructure (2026-05-27):

```
├── .claude/
│   └── commands/             # Project-level Claude Code slash commands
├── agents/
│   └── wayfinding/           # Domain agent cluster for indoor navigation
│       ├── layout_parser/    # Owns: coordinate ingestion, schema output
│       ├── routing_logic/    # Owns: Dijkstra/A* pathfinding via networkx
│       └── ui_generator/     # Owns: React Native map canvas and step UI
├── scripts/                  # Python validation gate scripts (pytest-tested, CI-integrated)
├── tests/                    # Pytest test suite for scripts/
└── docs/
    └── superpowers/
        └── specs/            # Design specs from brainstorming sessions
```

Server stack changed from Node.js + Express to Python 3.11+ + FastAPI.
`server/legacy/` remains as read-only reference for the prior Node.js implementation.
```

- [ ] **Step 6: Run full test suite one final time**

```bash
pytest tests/ -v
```

Expected: all 26 tests passing.

- [ ] **Step 7: Commit**

```bash
git add CLAUDE.md ARCHITECTURE.md
git commit -m "docs: update CLAUDE.md and ARCHITECTURE.md for v2 restructure

- Add wayfinding agent cluster to agent registry and monorepo tree
- Add .claude/commands/, scripts/, tests/ to directory map
- Update tech stack: Python + FastAPI, Pydantic v2, SQLAlchemy 2.0
- Clarify MappedIn is visual benchmark only, no runtime dependency"
```
