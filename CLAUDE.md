# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Meu Guia do Super** is a mobile-first grocery store app with indoor wayfinding and navigation. Core user value: shoppers can search for products and get turn-by-turn navigation guidance to locate items inside the physical store. [MappedIn](https://developer.mappedin.com/docs/overview) (specifically their [grocery store demo](https://app.mappedin.com/map/6679882a8298d5000b85ee89?floor=m_f62f718116360827)) is the visual and interaction benchmark for all path-finding screens.

---

## Monorepo Structure

This repo uses a **multi-agent orchestration model**. Each subdirectory has its own CLAUDE.md defining a specialized agent's role and constraints.

```
meu-guia-do-super-v2/
├── agents/
│   ├── product_management/   # PM/PO agent — user stories, backlog, acceptance criteria
│   ├── ux_design/            # UX agent — flows, tokens, mobile-first specs, SPECS/ folder
│   ├── quality_assurance/    # QA agent — test plans, Arrange-Act-Assert scripts
│   └── devsecops/            # DevSecOps agent — CI/CD, secrets, mobile distribution
├── client/                   # React Native / Expo frontend
│   ├── legacy/               # Reference web app (Vite/React) — inspiration only, not to be copied 1:1
│   └── src/
│       ├── assets/           # App logo + full-page screenshots from legacy app for UX reference
│       ├── components/
│       ├── pages/
│       ├── services/         # API clients — must match server/api-spec.md exactly
│       ├── stores/           # Zustand state
│       └── types/
├── server/                   # Node.js + TypeScript + Express backend
│   ├── legacy/               # Reference implementation — schema and route inspiration only
│   │   ├── controllers/      # authController, layoutController, navigationController, productController, etc.
│   │   ├── repositories/     # layoutRepository, productRepository, shelfRepository, supermarketRepository
│   │   ├── routes/           # Express route hooks
│   │   ├── services/         # navigationService.ts
│   │   └── utils/            # env.ts, jwt.ts, prisma.ts, zodSchemas.ts
│   ├── api-spec.md           # Single source of truth for all API contracts (v1)
│   └── src/                  # controllers/, repositories/, routes/, services/, utils/
├── ARCHITECTURE.md           # Directory map and folder conventions
├── DESIGN.md                 # Full Starbucks-inspired design system (colors, tokens, components)
└── agents/ux_design/SPECS/   # UI spec packs per flow: ADMIN/, CLIENT/, LANDING/
```

---

## Tech Stack

| Layer               | Technology                                                              |
| ------------------- | ----------------------------------------------------------------------- |
| Mobile              | React Native + Expo                                                     |
| Styling             | NativeWind (Tailwind CSS for RN)                                        |
| State               | Zustand                                                                 |
| Data fetching       | TanStack Query (React Query) with offline caching                       |
| Backend runtime     | Node.js + TypeScript + Express                                          |
| Validation          | Zod (all incoming inputs treated as hostile; parsed through middleware) |
| ORM                 | Prisma                                                                  |
| Database            | Supabase (PostgreSQL)                                                   |
| Auth                | JWT / OAuth2 with role-based access control for admin routes            |
| Caching             | Redis                                                                   |
| Email               | Resend (contact form submissions → Fabio's personal email)              |
| CI/CD               | GitHub Actions                                                          |
| IaC                 | Terraform / OpenTofu                                                    |
| Containerization    | Docker                                                                  |
| Security scanners   | Trufflehog, Snyk, SonarQube                                             |
| Mobile distribution | Fastlane, TestFlight, Google Play Console                               |

---

## Common Commands

The project is in early scaffolding phase. Commands will be added here as `client/` and `server/` are built out.

**Expected server pattern:**

```bash
cd server
npm run dev      # ts-node / tsx hot reload
npm run build    # tsc compile
npm run test     # jest / test suite
npm run lint     # ESLint + tsc --noEmit
```

**Expected client pattern:**

```bash
cd client
npx expo start           # Expo Metro bundler
npx expo start --ios
npx expo start --android
```

---

## Architecture Decisions

### Backend: Controller-Service-Repository Pattern

Three strict layers — no cross-layer access:

- **Controller** — extracts and validates input only; delegates to Service
- **Service** — business logic; no direct DB access
- **Repository** — data access only; no business logic

Reference implementations for all entities exist in `server/legacy/`.

### API Contract First

`server/api-spec.md` is the single source of truth. **Update the spec before implementing routes or clients.** The client's `src/services/` must mirror endpoint signatures exactly.

Current v1 endpoints: **Layouts** (CRUD + shelves query + offline download), **Shelves** (CRUD), **Products** (CRUD + section-filtered query).

### Backend Progression Sequence

Implement in incremental steps to reduce bugs:

1. Local, no API, no DB
2. Local, API, no DB
3. Local, API, DB
4. Cloud, API, DB
5. Cloud, API, Auth, DB

### Frontend: Mobile-First, No Mock Data in Production

- MSW (Mock Service Worker) is the only permitted mocking layer — strictly isolated from production builds.
- Use `FlatList` over `ScrollView` for all data lists (performance constraint).
- All API consumers must handle `loading`, `error`, `empty`, and `offline` states.

### Design System

`DESIGN.md` is the authoritative design reference. Key constraints:

- **Page canvas:** Neutral Warm `#f2f0eb` — never pure white.
- **Primary CTA:** Green Accent `#00754A`, white text, `50px` full-pill radius, `scale(0.95)` active state.
- **Typography:** SoDoSans (substitute Inter or Manrope for public builds) at `-0.01em` letter-spacing.
- **Gold `#cba258`:** reserved for Rewards/status ceremony only — never a general accent.
- No gradient fills — the system is solid color-block throughout.

App color ramp derives from `client/src/assets/app-logo.png`. Token file: `agents/ux_design/design_tokens.json`.

### Wayfinding Integration

Indoor navigation must be implemented with this project's proprietary code and architecture. MappedIn is a visual and interaction benchmark only. Route guidance, map control placement, and step progression should match the MappedIn grocery benchmark visually and interactively, without coupling runtime navigation to MappedIn services.

### Legacy Code Policy

`client/legacy/` and `server/legacy/` are **reference-only**. Read them for behavioral inspiration and data shape; adapt to mobile-first patterns, never port 1:1.

UX screenshots in `client/src/assets/` (`[page]client-happy-path.png`, `[page]client-empty-state.png`, `[page]landing-full-page.png`) show the legacy web UI. Use for flow and hierarchy reference only.

---

## Agent Orchestration

### Source of Truth Hierarchy

When instructions conflict, use this precedence order:

1. Task-specific requirements from the user.
2. This root CLAUDE.md.
3. Domain CLAUDE.md files under each folder.
4. Local implementation preferences.

If conflict still exists, stop and ask before implementing.

### Agent Registry

1. Product Management Agent
   Role: Defines what to build and why.
   Owns: backlog quality, user stories, acceptance criteria, prioritization.
   Path: agents/product_management/CLAUDE.md

2. UX Design Agent
   Role: Defines interaction model, visual hierarchy, and design tokens.
   Owns: user flows, component behavior states, accessibility constraints.
   Path: agents/ux_design/CLAUDE.md

3. Server Agent
   Role: Designs and implements backend contracts and services.
   Owns: API contracts, validation, persistence model, auth and authorization logic.
   Path: server/CLAUDE.md

4. Client Agent
   Role: Implements mobile-first frontend behavior and app state.
   Owns: UI implementation, API consumption, loading/error/offline UX states.
   Path: client/CLAUDE.md

5. Quality Assurance Agent
   Role: Validates behavior against requirements and contracts.
   Owns: integration tests, regression tests, negative path coverage, flake prevention.
   Path: agents/quality_assurance/CLAUDE.md

6. DevSecOps Agent
   Role: Guarantees secure, reproducible, and observable delivery pipelines.
   Owns: CI/CD, secrets strategy, security scanning gates, deployment controls.
   Path: agents/devsecops/CLAUDE.md

### Work Routing Matrix

1. Product Management Agent
   Role: Defines what to build and why.
   Owns: backlog quality, user stories, acceptance criteria, prioritization.
   Path: agents/product_management/CLAUDE.md

2. UX Design Agent
   Role: Defines interaction model, visual hierarchy, and design tokens.
   Owns: user flows, component behavior states, accessibility constraints.
   Path: agents/ux_design/CLAUDE.md

3. Server Agent
   Role: Designs and implements backend contracts and services.
   Owns: API contracts, validation, persistence model, auth and authorization logic.
   Path: server/CLAUDE.md

4. Client Agent
   Role: Implements mobile-first frontend behavior and app state.
   Owns: UI implementation, API consumption, loading/error/offline UX states.
   Path: client/CLAUDE.md

5. Quality Assurance Agent
   Role: Validates behavior against requirements and contracts.
   Owns: integration tests, regression tests, negative path coverage, flake prevention.
   Path: agents/quality_assurance/CLAUDE.md

6. DevSecOps Agent
   Role: Guarantees secure, reproducible, and observable delivery pipelines.
   Owns: CI/CD, secrets strategy, security scanning gates, deployment controls.
   Path: agents/devsecops/CLAUDE.md

### Default Delivery Sequence

For any medium or large feature:

1. **Product Management** → user story with measurable acceptance criteria (Gherkin syntax)
2. **UX Design** → mobile-first flows, state definitions, token mapping
3. **Server** → update `api-spec.md`, API contract, then implement controller-service-repository
4. **Client** → implement screens consuming agreed API contract
5. **QA** → happy path, edge cases, negative/security paths (Arrange-Act-Assert)
6. **DevSecOps** → CI/CD gates, security scan pass, release readiness

No stage is complete without explicit handoff artifacts.

### Handoff Contract (every agent output must include)

1. Inputs received
2. Decisions made
3. Artifacts created or modified
4. Open risks and assumptions
5. Explicit handoff target agent

**Minimum required handoffs:**

- Product Management → UX Design + Server
- UX Design → Client + QA
- Server → Client + QA
- Client → QA
- QA → DevSecOps + Product Management
- DevSecOps → Product Management (release readiness)

---

## Definitions

### Definition of Ready for Engineering

A task is ready for implementation only when all are true:

1. User story has measurable acceptance criteria.
2. UX flow covers loading, empty, success, and error states.
3. API contract is defined for every required integration.
4. Non-functional constraints are explicit (security, performance, offline behavior).

### Definition of Done (Cross-Agent)

A feature is done only when all are true:

1. Product criteria are met with no ambiguity.
2. UX behavior matches approved flow and accessibility constraints.
3. Client and server are contract-compatible.
4. QA reports passing coverage for happy path, edge, and negative paths.
5. DevSecOps gates pass with no critical security or release blockers.
6. Documentation is updated in the impacted folders.

---

## Change Management Rules

1. Do not bypass Product Management acceptance criteria.
2. Do not implement UI that diverges from UX state definitions without explicit approval.
3. Do not change API payloads without synchronized client and QA updates.
4. Do not merge pipeline changes that weaken security gates.
5. Any breaking change must include migration and rollback notes.

## Escalation Protocol

Stop and escalate to the user immediately when:

1. Requirement conflict between product scope and technical feasibility.
2. API contract disagreement between client and server.
3. Security risk with no acceptable mitigation.
4. Persistent test flakiness blocking release confidence.

---

## Task Intake Template

Use before any new implementation task:

1. Business objective
2. In-scope surfaces (client, server, infra, tests)
3. Out-of-scope items
4. Affected agents and ownership
5. Acceptance criteria
6. Risks and dependencies

---

## Execution Policy

1. Prefer small, verifiable increments over large unreviewed changes.
2. Keep all agents aligned to mobile-first assumptions unless explicitly overridden.
3. Validate contracts before coding integrations.
4. Preserve auditability by documenting key decisions in changed files.

---

## Quick Start Routing

If unsure where to start:

- **Unclear feature intent** → Product Management
- **Unclear interaction or state behavior** → UX Design
- **Unknown data model or API constraints** → Server
- **Implementation-only UI tasks with stable contracts** → Client
- **Bug reproduction, release confidence** → QA
- **Deployment, security, environment reliability** → DevSecOps

---

## Execution Examples

### New Feature Flow

1. Product Management writes user story with MoSCoW priority and Gherkin acceptance criteria.
2. UX Design defines mobile-first flow plus loading, empty, success, and error states.
3. Server updates `api-spec.md` and implements controller-service-repository.
4. Client implements screens, state handling, and API integration.
5. QA validates happy path, edge cases, and negative/security behavior.
6. DevSecOps enforces CI/CD and security gates before release.

Chain: `Product Management → UX + Server → Client → QA → DevSecOps → Product Management`

### Bugfix Flow

1. QA reproduces issue with deterministic steps and expected vs. actual behavior.
2. Product Management classifies severity and confirms target behavior.
3. Server and/or Client implement the minimal safe fix (contract-compatible).
4. QA executes regression tests on impacted flow and adjacent critical paths.
5. DevSecOps ensures pipelines pass before merge.

Chain: `QA → Product Management → Server/Client → QA → DevSecOps`

### Security Incident Flow

1. DevSecOps triages, assigns severity, and begins containment.
2. Server and Client apply remediations (auth hardening, input validation, secret rotation).
3. QA runs targeted abuse/negative-path validation on affected surfaces.
4. DevSecOps re-runs security scans, verifies mitigation, confirms release gates.
5. Product Management receives incident summary and communication-ready status.

Chain: `DevSecOps → Server + Client → QA → DevSecOps → Product Management`

---

## Branching Convention (GitFlow)

- One GitHub Issue per feature/fix
- Feature branches: `feature/<issue-slug>` off `main`
- Hotfix branches: `hotfix/<description>` off `main`
- PR to `main` with passing CI before merge
