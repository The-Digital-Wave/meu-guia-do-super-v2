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
    assert any("entry" in e.lower() for e in errors)
    assert any("exit" in e.lower() for e in errors)


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


def test_entry_node_is_reachable_from_all_nodes():
    # Arrange — entry node is isolated (has edge but is in disconnected component)
    graph = {
        "nodes": [
            {"id": "shelf-1", "type": "shelf", "coordinates": {"x": 0, "y": 0}},
            {"id": "shelf-2", "type": "shelf", "coordinates": {"x": 10, "y": 0}},
            {"id": "entry-1", "type": "entry", "coordinates": {"x": 50, "y": 50}},
            {"id": "exit-1", "type": "exit", "coordinates": {"x": 60, "y": 50}},
        ],
        "edges": [
            {"from": "shelf-1", "to": "shelf-2"},
            {"from": "entry-1", "to": "exit-1"},  # entry/exit isolated from shelves
        ],
        "bounds": {"min_x": 0, "max_x": 100, "min_y": 0, "max_y": 100},
    }
    # Act
    errors = validate_graph(graph)
    # Assert — either shelf-1/shelf-2 or entry-1/exit-1 must be flagged as unreachable
    assert any("Unreachable" in e for e in errors)
