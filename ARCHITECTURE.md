# System Micro-Architecture Spec

## Core Topography

1. `agents/` - Domain-specific guardrails and role instructions.
2. `agents/product_management/` - Functional features, logic validation boundaries, PRDs.
3. `agents/ux_design/` - Visual specs, interface states, variables documentation.
4. `agents/quality_assurance/` - Testing strategies using Arrange-Act-Assert structures.
5. `agents/devsecops/` - Pipeline infrastructure, secrets checks, distribution setups.
6. `SPECS/` - UI specification packs grouped by app flow, indexed in Markdown.
7. `server/` - Backend service layer guardrails and implementation space.
8. `client/` - Front-facing application layer guardrails and implementation space.

## Folder structure

my-mobile-app/
│
├── CLAUDE.md # GLOBAL RULES (Shared build scripts, repo context)
├── ARCHITECTURE.md # GLOBAL DIRECTORY MAP (The source of truth layout)
├── SPECS/
│ ├── index.md # Root index for all UI spec packs
│ ├── ADMIN/
│ │ ├── admin-specs.md # Admin flow spec
│ │ └── admin-_.png # Admin screen captures
│ ├── CLIENT/
│ │ ├── client-specs.md # Client flow spec
│ │ └── client-_.png # Client screen captures
│ └── LANDING/
│ ├── landing-specs.md # Landing flow spec
│ └── landing-\*.png # Landing screen captures
│
├── agents/
│ ├── 📋 product_management/
│ │ ├── CLAUDE.md # PRODUCT MANAGER & PO AGENT GUARDRAILS
│ │ ├── backlog.md # Feature tracking & prioritization lists
│ │ └── user_stories/ # Gherkin-syntax requirements files
│ │
│ ├── 🎨 ux_design/
│ │ ├── CLAUDE.md # UI/UX DESIGN AGENT GUARDRAILS
│ │ └── design_tokens.json # Shared variables (Typography, spacing, colors)
│ │
│ ├── 🧪 quality_assurance/
│ │ ├── CLAUDE.md # QA ENGINEER AGENT GUARDRAILS
│ │ └── integration_tests/ # E2E automation assertion definitions
│ │
│ └── 🚀 devsecops/
│ ├── CLAUDE.md # DEVSECOPS PIPELINE AGENT GUARDRAILS
│ └── .github/workflows/ # Continuous delivery actions templates
│
├── 💻 server/ # DECOUPLED BACKEND LAYER
│ ├── CLAUDE.md # BACKEND ENGINEER AGENT GUARDRAILS
│ ├── prisma/
│ │ ├── schema.prisma # Database models & relationships
│ │ └── seed.ts # Mock data definitions
│ └── src/
│ ├── controllers/ # Input extraction & route handlers
│ ├── repositories/ # Direct data access queries
│ ├── routes/ # Express/FastAPI server router hooks
│ ├── utils/ # Zod parsing/validation schemas
│ └── index.ts # Main execution entry point
│
├── 📱 client/ # DECOUPLED FRONTEND MOBILE LAYER
│ ├── CLAUDE.md # FRONTEND MOBILE ENGINEER AGENT GUARDRAILS
│ └── src/
│ ├── components/ # Structural visual abstractions
│ │ ├── AdminHeader.tsx
│ │ ├── AdminSidebar.tsx
│ │ ├── AdminGrid.tsx
│ │ └── modals/ # Creation layout overlays
│ ├── pages/ # Navigational screen layouts (Admin.tsx)
│ ├── services/ # API communication layers (adminService.ts)
│ ├── stores/ # Local memory data orchestration (adminStore.ts)
│ └── types/ # Frontend TypeScript contracts (admin.ts)

---

## Updated Folder Structure (v2 — 2026-05-27)

The following directories were added in the multi-agent orchestration restructure:

```
meu-guia-do-super-v2/
├── .claude/
│   └── commands/             # Project-level Claude Code slash commands (auto-loaded per session)
│       ├── map-coordinate-transformer.md   # /map-coordinate-transformer → Layout Parser Agent
│       ├── pathfinder-dijkstra-calc.md     # /pathfinder-dijkstra-calc → Routing Logic Agent
│       └── waypoint-rn-ui.md              # /waypoint-rn-ui → UI Generator Agent
│
├── agents/
│   └── wayfinding/           # Domain agent cluster for indoor navigation
│       ├── layout_parser/    # Owns: coordinate ingestion, schema output to output/schema.json
│       ├── routing_logic/    # Owns: Dijkstra/A* via networkx, output to output/routing_output.json
│       └── ui_generator/     # Owns: React Native map canvas, controls, step list, FAB
│
├── scripts/                  # Python validation gate scripts (pytest-tested, CI exit-code 0/1)
│   ├── validate_api_contract.py      # Validates server/api-spec.md (sections + endpoint format)
│   ├── validate_agent_handoffs.py    # Validates handoff artifacts (--stage flag per pipeline stage)
│   └── verify_navigation_graph.py   # Validates nav graph integrity (no floating/duplicate/unreachable nodes)
│
├── tests/                    # Pytest suite for scripts/ — 32 tests, python -m pytest tests/ -v
│
└── docs/
    └── superpowers/
        ├── specs/            # Design specs from brainstorming sessions
        └── plans/            # Implementation plans
```

### Stack changes (v2)

| Layer | v1 (legacy reference) | v2 (implementation target) |
|---|---|---|
| Backend runtime | Node.js + TypeScript + Express | Python 3.11+ + FastAPI |
| Validation | Zod | Pydantic v2 |
| ORM | Prisma | SQLAlchemy 2.0 async + Alembic |
| Password hashing | bcrypt (Node) | passlib[bcrypt] |
| Redis client | ioredis | aioredis |
| Graph/pathfinding | — | networkx (Dijkstra/A*) |
| API docs | Manual Swagger | FastAPI auto-generated /docs + /redoc |
