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
    try:
        result = subprocess.run(
            [sys.executable, "scripts/validate_api_contract.py"],
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
    except FileNotFoundError:
        return ["scripts/validate_api_contract.py not found — ensure the script exists"]

    if result.returncode != 0:
        output = (result.stdout + result.stderr).strip()
        return [f"API contract validation failed:\n    {output}"]
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
    sys.stdout.reconfigure(encoding="utf-8")
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
