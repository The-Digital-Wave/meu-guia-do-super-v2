# System Micro-Architecture Spec

## Core Topography

1. `agents/` - Domain-specific guardrails and role instructions.
2. `agents/product_management/` - Functional features, logic validation boundaries, PRDs.
3. `agents/ux_design/` - Visual specs, interface states, variables documentation.
4. `agents/quality_assurance/` - Testing strategies using Arrange-Act-Assert structures.
5. `agents/devsecops/` - Pipeline infrastructure, secrets checks, distribution setups.
6. `server/` - Backend service layer guardrails and implementation space.
7. `client/` - Front-facing application layer guardrails and implementation space.

## Folder structure

my-mobile-app/
│
├── CLAUDE.md # GLOBAL RULES (Shared build scripts, repo context)
├── ARCHITECTURE.md # GLOBAL DIRECTORY MAP (The source of truth layout)
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
