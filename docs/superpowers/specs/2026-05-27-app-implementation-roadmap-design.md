# Meu Guia do Super — Full App Implementation Roadmap
**Date:** 2026-05-27  
**Status:** Approved design → ready for phased implementation planning

---

## Context

The codebase has 100% documentation coverage and 0% code. This document defines the full build roadmap for the first production-ready version of the app, covering backend, frontend, infrastructure, and app store delivery.

---

## Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| Indoor positioning (MVP) | Manual tap-to-locate | Zero hardware dependency; unblocks all navigation logic immediately. BLE beacons = v2. |
| Admin panel (MVP) | No — seed data only | One hardcoded test store; no upload UI needed to validate core user flow. |
| Build order | Backend first, then frontend | Clean API contract boundary before any client code. |
| Backend hosting | Render (existing account) | Free tier (750h/mo), native Python/FastAPI support, Docker-ready. |
| Database | Supabase (existing account) | Already in stack; free tier: 500MB PostgreSQL. |
| Cache | Upstash (serverless Redis) | Free tier: 10k cmd/day, 256MB; zero-infra setup. |
| Frontend mobile | Expo + EAS Build | Free tier: 30 builds/month; OTA updates via Expo Updates. |
| Frontend web (PWA) | Vercel | Free tier; zero-config for Expo Web output. |
| App store | EAS Submit → TestFlight + Google Play | Apple Developer + Google Play Console accounts needed (user does not have yet). |

---

## MVP Feature Scope

What must work end-to-end in v1:

1. **User can search for a product** → sees its location on the store map
2. **User taps their location on the map** → app draws shortest-path route to the product
3. **User adds multiple items to a grocery list** → taps "Optimize" → list reorders by walk distance
4. **Store map loads** from a seeded test layout (one supermarket, hardcoded shelves/products)
5. **Auth**: JWT login/register so user's grocery list persists across sessions

Out of scope for MVP: BLE beacons, admin layout editor, multiple stores, offline mode, social features.

---

## Data Model (Core Entities)

```
Supermarket → Layouts (floor plans) → Shelves → Products
                                    ↘ Nodes (graph vertices) → Edges (graph paths)
Users → GroceryLists → GroceryListItems → Products
```

**Key tables:**
- `supermarkets` — id, name, address
- `layouts` — id, supermarket_id, name, width_m, height_m, image_url
- `nodes` — id, layout_id, x, y, node_type (INTERSECTION | SHELF_FRONT | ENTRY | EXIT)
- `edges` — id, node_from_id, node_to_id, distance_m, bidirectional
- `shelves` — id, layout_id, node_id (anchor), aisle, section, label
- `products` — id, shelf_id, name, sku, category, image_url
- `users` — id, email, password_hash, role (CUSTOMER | ADMIN)
- `grocery_lists` — id, user_id, layout_id, created_at
- `grocery_list_items` — id, list_id, product_id, checked, sort_order

---

## API Contract Additions Needed

The existing `server/api-spec.md` covers Layouts, Shelves, Products CRUD. The following must be added before implementation:

| Group | New Endpoints |
|---|---|
| **Auth** | POST /auth/register, POST /auth/login, POST /auth/refresh, POST /auth/logout |
| **Navigation** | GET /layouts/:id/graph, POST /navigation/route (start_node, product_ids → ordered path) |
| **Grocery Lists** | CRUD /grocery-lists, CRUD /grocery-lists/:id/items, POST /grocery-lists/:id/optimize |
| **Nodes/Edges** | GET /layouts/:id/nodes, POST /layouts/:id/nodes, GET /layouts/:id/edges |
| **Users** | GET /users/me, PUT /users/me |

---

## Build Phases

### Phase 1 — Backend Foundation (FastAPI + DB)
**Deliverables:**
- FastAPI app scaffold with `src/main.py`, `src/config.py`, `src/database.py`
- SQLAlchemy 2.0 async models for all entities above
- Alembic migrations baseline
- Supabase PostgreSQL connection (async engine via asyncpg)
- Seed script: one test supermarket, 1 layout, 30 nodes, 40 edges, 10 shelves, 50 products
- Health check: `GET /health`
- Docker: `Dockerfile` + `docker-compose.yml` (app + local Postgres for dev)
- Ruff + mypy clean

**Agent:** Server Agent

---

### Phase 2 — Core API (Controller-Service-Repository)
**Deliverables:**
- Complete `server/api-spec.md` (add auth, navigation, grocery list, nodes/edges endpoints)
- Auth: JWT login/register with passlib[bcrypt] + python-jose
- Pydantic v2 schemas for all request/response models
- Controller-service-repository implementation for:
  - Layouts (CRUD + graph download)
  - Shelves (CRUD)
  - Products (CRUD + search by name/category)
  - Nodes + Edges (read + seed import)
  - Grocery Lists (CRUD + items)
- Role-based access control (CUSTOMER vs ADMIN guards)
- Integration tests (pytest + httpx AsyncClient)

**Agent:** Server Agent

---

### Phase 3 — Wayfinding Engine
**Deliverables:**
- Navigation graph builder: loads nodes/edges from DB → builds networkx DiGraph
- Dijkstra shortest path: `POST /navigation/route` → returns ordered list of nodes with (x,y) coordinates
- Multi-stop optimizer: TSP nearest-neighbor heuristic → reorders grocery list items by walk distance
- `POST /grocery-lists/:id/optimize` endpoint
- Unit tests for graph building + pathfinding (pytest)
- Validation: `scripts/verify_navigation_graph.py` passes against seeded data

**Agent:** Routing Logic Agent (`/pathfinder-dijkstra-calc`)  
**Skill trigger:** `/pathfinder-dijkstra-calc`

---

### Phase 4 — Frontend Foundation (Expo)
**Deliverables:**
- Expo scaffold (`npx create-expo-app client --template blank-typescript`)
- NativeWind 4 configured with design tokens from `agents/ux_design/design_tokens.json`
- React Navigation (Stack + Tab) wired up
- Zustand stores: `useAuthStore`, `useGroceryListStore`, `useNavigationStore`
- TanStack Query client with axios base URL pointing to Render backend
- Auth screens: Login, Register (matching DESIGN.md tokens — warm cream canvas, green CTA)
- MSW handlers for all API endpoints (for offline/test builds)

**Agent:** Client Agent

---

### Phase 5 — Client Screens
**Deliverables:**
- Home screen: product search bar + recent items
- Search results: `FlatList` of products with shelf location badges
- Store map screen: tap-to-locate (user taps → position snapped to nearest node), product pins
- Route overlay: SVG path drawn between user position and selected product
- Grocery list screen: items list + Optimize button (calls `/grocery-lists/:id/optimize`)
- Navigation screen: step-by-step directions (node-by-node text guidance)
- All screens handle: loading, empty, error, offline states
- MappedIn grocery demo visual parity for map + route screens

**Agent:** UI Generator Agent (`/waypoint-rn-ui`) + Client Agent  
**Skill triggers:** `/waypoint-rn-ui`

---

### Phase 6 — Infrastructure & CI/CD
**Deliverables:**
- GitHub Actions workflows:
  - `ci.yml`: on PR → ruff, mypy, pytest, Expo type-check, security scan (Trufflehog, Snyk)
  - `deploy-backend.yml`: on merge to main → Docker build → Render deploy via API
  - `deploy-frontend-web.yml`: on merge to main → `expo export --platform web` → Vercel deploy
  - `eas-build.yml`: manual trigger → EAS Build (iOS + Android)
- Upstash Redis provisioned + connected to FastAPI cache layer
- Render environment variables configured (DATABASE_URL, JWT_SECRET, REDIS_URL, etc.)
- Terraform/OpenTofu IaC: Render service definition, Upstash resource (optional, can be manual)

**Agent:** DevSecOps Agent

---

### Phase 7 — App Store Delivery
**Pre-requisite:** User must acquire Apple Developer Program ($99/yr) + Google Play Console ($25 one-time)

**Deliverables:**
- `eas.json` configured for development, preview, and production profiles
- Fastlane: `Fastfile` with `beta` lane (TestFlight) + `deploy` lane (App Store / Play Store)
- App Store Connect: app record created, screenshots, metadata
- Google Play Console: app created, internal test track
- EAS Submit pipeline wired into `eas-build.yml`
- Expo Updates (`expo-updates`) configured for OTA pushes

**Agent:** DevSecOps Agent

---

## Hosting Architecture (Production)

```
[Expo Mobile App]  →  [Render — FastAPI Docker container]
                           ↓                    ↓
                    [Supabase PostgreSQL]  [Upstash Redis]
                    
[Expo Web (PWA)]   →  [Vercel CDN]
```

All secrets managed via Render environment variables and GitHub Actions secrets. No secrets in code.

---

## Agent Work Routing

| Phase | Primary Agent | Supporting |
|---|---|---|
| 1 | Server Agent | — |
| 2 | Server Agent | QA Agent (contract tests) |
| 3 | Routing Logic Agent | Server Agent, QA Agent |
| 4 | Client Agent | UX Design Agent |
| 5 | UI Generator Agent + Client Agent | QA Agent |
| 6 | DevSecOps Agent | — |
| 7 | DevSecOps Agent | — |

---

## Verification Checklist (per phase)

- [ ] Phase 1: `python -m pytest tests/ -v` passes; `GET /health` returns 200; Docker compose up works
- [ ] Phase 2: All endpoints in api-spec.md return correct status codes; auth flow works end-to-end
- [ ] Phase 3: `scripts/verify_navigation_graph.py` passes; route between two nodes returns correct path
- [ ] Phase 4: `npx expo start` runs; auth screens render on iOS Simulator and Android Emulator
- [ ] Phase 5: Full user flow works (search → map → route → grocery list optimize) on device
- [ ] Phase 6: CI pipeline passes on a PR; deploy pipeline pushes to Render and Vercel successfully
- [ ] Phase 7: Build lands in TestFlight internal testing track

---

## Open Items / Risks

| Risk | Mitigation |
|---|---|
| Apple Developer + Play Console accounts not purchased yet | Phase 7 cannot start without them; purchase before Phase 6 completes |
| Render free tier spins down after 15 min inactivity | Acceptable for MVP; upgrade to paid ($7/mo) before store demos |
| Supabase free tier: 2-project limit | One project for dev, one for prod; keep test data in dev project |
| networkx graph pathfinding performance at scale | Acceptable for MVP (<500 nodes); move to PostGIS-based graph for v2 if needed |
