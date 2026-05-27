# Design Spec: Multi-Agent Orchestration Restructure

**Date:** 2026-05-27
**Status:** Approved — ready for implementation planning
**Author:** Claude Code (brainstorming session)

---

## Context

Based on a NotebookLM compliance report auditing the project against Anthropic's multi-agent architecture best practices, three deviations were identified:

1. **Loose context enforcement** — agents were fed raw multi-domain artifacts instead of scoped inputs
2. **No programmatic validation gates** — handoffs relied on manual text artifacts with no automated enforcement
3. **No specialized wayfinding agents** — the indoor navigation domain had no dedicated agent roles or skills

This spec defines the changes required to address all three deviations.

---

## Approved Approach: Grouped Wayfinding Cluster (Approach B)

- Keep existing general agents (`product_management`, `ux_design`, `quality_assurance`, `devsecops`) unchanged
- Add a `agents/wayfinding/` cluster for the 3 specialized navigation agents
- Add `.claude/commands/` for project-level slash command skills
- Add `scripts/` for Python validation gate scripts
- Update `server/CLAUDE.md` for Python + FastAPI (replacing Node.js + Express legacy stack)
- Nothing existing is moved or deleted — all changes are additive

---

## Section 1: Folder Structure Changes

All changes are additive. No existing files are moved or deleted.

```
meu-guia-do-super-v2/
│
├── .claude/
│   └── commands/                              ← NEW
│       ├── map-coordinate-transformer.md      ← project skill (Layout Parser)
│       ├── pathfinder-dijkstra-calc.md        ← project skill (Routing Logic)
│       └── waypoint-rn-ui.md                  ← project skill (UI Generator)
│
├── agents/
│   ├── product_management/                    ← unchanged
│   ├── ux_design/                             ← unchanged
│   ├── quality_assurance/                     ← unchanged
│   ├── devsecops/                             ← unchanged
│   └── wayfinding/                            ← NEW cluster
│       ├── layout_parser/
│       │   └── CLAUDE.md
│       ├── routing_logic/
│       │   └── CLAUDE.md
│       └── ui_generator/
│           └── CLAUDE.md
│
├── scripts/                                   ← NEW
│   ├── validate_api_contract.py
│   ├── validate_agent_handoffs.py
│   └── verify_navigation_graph.py
│
├── docs/
│   └── superpowers/
│       └── specs/                             ← NEW (this file lives here)
│
├── client/                                    ← unchanged
├── server/                                    ← CLAUDE.md updated for Python + FastAPI
├── CLAUDE.md                                  ← updated to reflect new structure
└── ARCHITECTURE.md                            ← updated
```

**Rationale for `.claude/` vs `agents/` split:**
- `.claude/commands/` = pure Claude Code tooling (slash commands). Correct location per Claude Code conventions.
- `agents/` = project content + agent instructions (CLAUDE.md files alongside living artifacts like `backlog.md`, `design_tokens.json`, `SPECS/`). Stays at root — hidden `.claude/` directories are unconventional for project content.

---

## Section 2: Wayfinding Agent Roles

Three new `CLAUDE.md` files under `agents/wayfinding/`. Each agent has a single, non-overlapping responsibility.

### Layout Parser Agent
**Path:** `agents/wayfinding/layout_parser/CLAUDE.md`

**Role:** Entry point for all physical store data. Ingests raw layout definitions and transforms them into validated backend schemas.

- **Owns:** coordinate map ingestion, grid-to-schema transformation, shelf boundary validation, anchor point normalization
- **Inputs:** raw layout definitions (CSV grids, JSON coordinate tables, dimension specs from store operators)
- **Outputs:** validated SQLAlchemy models ready for Alembic migration; structured layout JSON consumable by downstream agents
- **Hard boundary:** does NOT write routing algorithms, does NOT design UI, does NOT execute database writes — produces schema definitions only
- **Validation gate:** must run `scripts/verify_navigation_graph.py` before declaring output ready

### Routing Logic Agent
**Path:** `agents/wayfinding/routing_logic/CLAUDE.md`

**Role:** All mathematical wayfinding. Purely algorithmic — no database writes, no UI.

- **Owns:** shortest-path calculation (Dijkstra/A*), node graph validation, multi-stop route ordering, accessibility weighting, coordinate snapping, floating node detection
- **Stack constraint:** Python with `networkx` for graph operations
- **Benchmark:** MappedIn grocery store demo — route calculation must match MappedIn's multi-stop ordering and accessibility-weight behaviour
- **Inputs:** validated node graph output from Layout Parser Agent
- **Outputs:** sequential routing segments, ordered waypoint lists, distance + estimated travel time per segment
- **Hard boundary:** cannot touch frontend components, cannot modify persisted data, cannot access DB directly — receives and returns structured data only
- **Validation gate:** must run `scripts/verify_navigation_graph.py` on input graph before beginning calculations

### UI Generator Agent
**Path:** `agents/wayfinding/ui_generator/CLAUDE.md`

**Role:** Translates routing output into React Native wayfinding UI. Visual and interaction benchmark is the [MappedIn grocery store demo](https://app.mappedin.com/map/6679882a8298d5000b85ee89?floor=m_f62f718116360827).

- **Owns:** indoor map canvas component, route overlay rendering, map controls (recenter, zoom, step-through), navigation state machine (idle → routing → arrived), MappedIn-parity visual specs
- **Inputs:** routing segments from Routing Logic Agent + design tokens from `agents/ux_design/design_tokens.json`
- **Outputs:** React Native components written to `client/src/components/wayfinding/`
- **Hard boundary:** does NOT own routing algorithms; does NOT deviate from UX Design Agent token system without explicit approval; enforces `#f2f0eb` canvas, `>44px` touch targets, `FlatList` for waypoint lists
- **Validation gate:** must run `scripts/validate_agent_handoffs.py --stage routing-to-ui` before generating any UI output

### Inter-agent data flow

```
Store operator raw data
         │
         ▼
[Layout Parser Agent]
  verify_navigation_graph.py ✅
         │
         ├── validated schema models ──▶ [Server Agent / DB]
         │
         └── validated node graph
                  │
                  ▼
         [Routing Logic Agent]
           verify_navigation_graph.py ✅
                  │
                  └── routing segments + waypoints
                           │
                           ▼
                  [UI Generator Agent]
                    validate_agent_handoffs.py --stage routing-to-ui ✅
                           │
                           └── React Native components
                                    │
                                    ▼
                           [Client Agent] (integration)
```

---

## Section 3: Project Skills (`.claude/commands/`)

Three markdown files, each becoming a `/slash-command` in Claude Code sessions. Each skill activates the corresponding agent context and enforces its hard boundaries.

### `/map-coordinate-transformer`
**File:** `.claude/commands/map-coordinate-transformer.md`

Activates the Layout Parser Agent. Workflow:
1. Read `agents/wayfinding/layout_parser/CLAUDE.md` before any action
2. Accept raw layout input (CSV, JSON, dimension tables)
3. Validate coordinate boundaries and anchor points
4. Flag floating shelves or out-of-bounds coordinates as **blocking errors** before producing output
5. Run `scripts/verify_navigation_graph.py` to confirm node integrity
6. Output validated SQLAlchemy model definition and structured JSON only — nothing else

### `/pathfinder-dijkstra-calc`
**File:** `.claude/commands/pathfinder-dijkstra-calc.md`

Activates the Routing Logic Agent. Workflow:
1. Read `agents/wayfinding/routing_logic/CLAUDE.md` before any action
2. Accept validated node graph (output from Layout Parser)
3. Run `scripts/verify_navigation_graph.py` on input — **hard stop** if validation fails
4. Apply Dijkstra/A* with accessibility weighting, benchmarked against MappedIn multi-stop ordering
5. Output ordered waypoint segments with distance + estimated travel time per segment
6. Do not produce partial routes — all-or-nothing output

### `/waypoint-rn-ui`
**File:** `.claude/commands/waypoint-rn-ui.md`

Activates the UI Generator Agent. Workflow:
1. Read `agents/wayfinding/ui_generator/CLAUDE.md` and `agents/ux_design/CLAUDE.md` before any action
2. Run `scripts/validate_agent_handoffs.py --stage routing-to-ui` — **hard stop** if upstream artifacts missing
3. Consume routing segments + `agents/ux_design/design_tokens.json`
4. Generate React Native components benchmarked against MappedIn visual layout
5. Enforce `#f2f0eb` canvas, `>44px` touch targets, `FlatList` for all waypoint lists
6. Write output to `client/src/components/wayfinding/`

### Skill chaining and gate enforcement

```
/map-coordinate-transformer
        └── verify_navigation_graph.py ✅ → blocks if nodes invalid
                │
                ▼
        /pathfinder-dijkstra-calc
                └── verify_navigation_graph.py ✅ → blocks if graph malformed
                        │
                        ▼
                /waypoint-rn-ui
                        └── validate_agent_handoffs.py --stage routing-to-ui ✅ → blocks if routing output missing
```

---

## Section 4: Validation Scripts (`scripts/`)

Three Python scripts acting as programmatic gates. All exit with code `0` (pass) or `1` (fail) for GitHub Actions CI integration.

### `validate_api_contract.py`

Validates `server/api-spec.md` completeness before any client service code is written.

**Rules:**
- Every documented endpoint has: HTTP method, path, request shape, response shape, at least one error status code
- All routes carry `/v1/` version prefix
- Required resource sections present: `Layouts`, `Shelves`, `Products`
- No validation against `server/legacy/` — legacy is reference only and never cross-referenced

**Output:** Pass/fail per rule with specific missing field or violation identified by name.

### `validate_agent_handoffs.py`

Checks that mandatory handoff artifacts exist before the next agent stage proceeds.

**Stages and artifacts checked:**

| `--stage` flag | Artifact checked |
|---|---|
| `pm-to-ux` | At least one `.md` file in `agents/product_management/user_stories/` |
| `ux-to-client` | `agents/ux_design/SPECS/` has at least one `*-specs.md` + `design_tokens.json` is non-empty |
| `layout-to-routing` | Layout Parser output schema file exists (configurable path via `--output-path`) |
| `routing-to-ui` | Routing output JSON exists with required `waypoints` and `segments` keys |
| `server-to-client` | `validate_api_contract.py` exits `0` |
| `all` | All stages checked in sequence |

**Usage:** `python scripts/validate_agent_handoffs.py --stage routing-to-ui`

### `verify_navigation_graph.py`

Validates mathematical integrity of the store navigation graph. Called by both `/map-coordinate-transformer` and `/pathfinder-dijkstra-calc`.

**Rules:**
- All shelf nodes have at least one edge connection (no floating nodes)
- All coordinate values within declared layout boundary box
- No duplicate node IDs
- Graph is fully connected (no isolated subgraphs)
- Entry/exit nodes are explicitly marked and reachable from all other nodes

**Output:** Lists each failing node by ID and coordinate with specific violation type (floating, out-of-bounds, duplicate, unreachable).

### CI integration

```yaml
# .github/workflows/validate.yml
- name: Validate API contract
  run: python scripts/validate_api_contract.py

- name: Validate agent handoffs
  run: python scripts/validate_agent_handoffs.py --stage all

- name: Verify navigation graph
  run: python scripts/verify_navigation_graph.py
```

---

## Section 5: Server CLAUDE.md — Python + FastAPI

The existing `server/CLAUDE.md` is replaced with a Python + FastAPI context. `server/legacy/` is preserved as read-only reference for data shapes, entity relationships, and route patterns only — it is never modified and never cross-referenced by validation scripts.

### Stack replacement

| Legacy (reference only) | New implementation target |
|---|---|
| Node.js + TypeScript | Python 3.11+ |
| Express | FastAPI |
| Zod | Pydantic v2 |
| Prisma ORM | SQLAlchemy 2.0 (async) + Alembic migrations |
| `zodSchemas.ts` | Pydantic schema classes in `server/src/schemas/` |
| `index.ts` entry point | `server/src/main.py` |
| Manual Swagger docs | FastAPI auto-generated `/docs` + `/redoc` |
| `bcrypt` (Node) | `passlib` + `bcrypt` (Python) |
| Redis via `ioredis` | Redis via `aioredis` |

### New server folder structure

```
server/
├── CLAUDE.md              ← updated (Python + FastAPI context)
├── api-spec.md            ← unchanged, still human-readable source of truth
├── legacy/                ← reference only, never modified
└── src/
    ├── main.py            ← FastAPI app entry point, router registration, middleware
    ├── routers/           ← one file per resource: layouts.py, shelves.py, products.py, navigation.py
    ├── controllers/       ← input extraction + Pydantic validation only; delegates to services
    ├── services/          ← business logic
    │   └── navigation_service.py  ← Dijkstra/A* via networkx, MappedIn-benchmarked
    ├── repositories/      ← async SQLAlchemy queries only, no business logic
    ├── models/            ← SQLAlchemy ORM models
    ├── schemas/           ← Pydantic request/response models
    └── utils/
        ├── auth.py        ← JWT + OAuth2 via python-jose / fastapi-users
        ├── database.py    ← async engine + session factory (Supabase PostgreSQL)
        └── config.py      ← pydantic-settings for environment variable management
```

### Architectural rules

- **Controller-Service-Repository** pattern preserved exactly — same three-layer separation, Python idioms
- **All inputs** validated through Pydantic models before reaching the service layer
- **FastAPI auto-OpenAPI** generates `/docs` (Swagger UI) and `/redoc` on every run — `api-spec.md` is the human contract, `/docs` is the live machine-generated complement
- **All routes** prefixed `/v1/` via `APIRouter(prefix="/v1")`
- **Navigation service** uses `networkx` for graph operations, benchmarked against MappedIn for route legibility, step guidance UX, and multi-stop ordering
- **Backend progression sequence** unchanged: Local no-DB → Local API no-DB → Local API + DB → Cloud API + DB → Cloud API + Auth + DB
- **Redis** via `aioredis` for caching
- **Supabase PostgreSQL** via async SQLAlchemy engine

---

## Files to Create or Update

| Action | File |
|---|---|
| CREATE | `.claude/commands/map-coordinate-transformer.md` |
| CREATE | `.claude/commands/pathfinder-dijkstra-calc.md` |
| CREATE | `.claude/commands/waypoint-rn-ui.md` |
| CREATE | `agents/wayfinding/layout_parser/CLAUDE.md` |
| CREATE | `agents/wayfinding/routing_logic/CLAUDE.md` |
| CREATE | `agents/wayfinding/ui_generator/CLAUDE.md` |
| CREATE | `scripts/validate_api_contract.py` |
| CREATE | `scripts/validate_agent_handoffs.py` |
| CREATE | `scripts/verify_navigation_graph.py` |
| UPDATE | `server/CLAUDE.md` (Python + FastAPI) |
| UPDATE | `CLAUDE.md` (reflect new structure + Python stack) |
| UPDATE | `ARCHITECTURE.md` (reflect new directories) |

---

## Out of Scope

- Writing any application code in `server/src/` or `client/src/` — this spec covers agent context, skills, and validation infrastructure only
- Modifying any existing agent CLAUDE.md files (`product_management`, `ux_design`, `quality_assurance`, `devsecops`)
- Implementing the MappedIn pathfinding algorithm — that is owned by the Routing Logic Agent during implementation
- CI/CD pipeline changes beyond the validation workflow stub — owned by DevSecOps Agent

---

## Risks and Assumptions

| Risk | Mitigation |
|---|---|
| `verify_navigation_graph.py` cannot run without actual graph data during early dev | Script accepts a `--skip-if-empty` flag to pass gracefully when no layout data exists yet |
| `validate_agent_handoffs.py --stage all` blocks CI when upstream agents haven't produced artifacts yet | Each stage is independently skippable via `--stage <specific>` — CI runs only the stages relevant to changed files |
| Python + FastAPI unfamiliar if team has only worked in Node.js | Legacy folder provides structural reference; controller-service-repository pattern maps 1:1 across both stacks |
