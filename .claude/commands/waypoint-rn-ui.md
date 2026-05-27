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
