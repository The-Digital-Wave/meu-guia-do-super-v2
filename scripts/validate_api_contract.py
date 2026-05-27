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
    r"-\s+\*\*(GET|POST|PUT|DELETE|PATCH)\s+(/[^\*\n]+)\*\*[ \t]*->[ \t]*([^\n]*)?"
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

    try:
        content = spec_path.read_text(encoding="utf-8")
    except OSError as exc:
        print(f"❌ Could not read {spec_path}: {exc}")
        sys.exit(1)

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
