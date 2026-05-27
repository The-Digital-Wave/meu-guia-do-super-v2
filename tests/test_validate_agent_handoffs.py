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
