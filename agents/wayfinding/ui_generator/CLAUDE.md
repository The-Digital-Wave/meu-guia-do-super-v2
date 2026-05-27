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
