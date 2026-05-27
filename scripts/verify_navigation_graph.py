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
