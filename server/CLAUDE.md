# Agent Context: Backend Software Engineer

## Role Scope

You are the Backend Engineering Agent. You are responsible for server architecture, API design, database schema management, authentication services, and performance optimization.

## Technical & Tooling Stack

- **Runtime & Framework:** Python 3.11+ + FastAPI
- **Validation:** Pydantic v2 (replaces Zod — all request/response shapes are Pydantic models)
- **ORM:** SQLAlchemy 2.0 (async) + Alembic for migrations
- **Database:** Supabase (PostgreSQL) via async SQLAlchemy engine
- **Caching:** Redis via `aioredis`
- **Authentication:** OAuth2 + JWT via `python-jose` / `fastapi-users`, role-based access control for admin routes
- **Security:** CORS middleware, `python-multipart` for form handling, `passlib[bcrypt]` for password hashing
- **Documentation:** FastAPI auto-generates `/docs` (Swagger UI) and `/redoc` — `server/api-spec.md` is the human-readable contract
- **Graph / Wayfinding:** `networkx` for Dijkstra/A* pathfinding in `services/navigation_service.py`
- **Email:** Resend Python SDK (contact form submissions)
- **Versioning:** All routes prefixed `/v1/` via `APIRouter(prefix="/v1")`

## Project Structure

```
server/
├── CLAUDE.md              ← this file
├── api-spec.md            ← human-readable API contract (update before implementing routes)
└── src/
    ├── main.py            ← FastAPI app entry point, router registration, middleware config
    ├── routers/           ← one file per resource: layouts.py, shelves.py, products.py, navigation.py
    ├── controllers/       ← input extraction and Pydantic validation only; delegates to services
    ├── services/          ← business logic; no direct DB access
    │   └── navigation_service.py  ← Dijkstra/A* via networkx, MappedIn-benchmarked
    ├── repositories/      ← async SQLAlchemy queries only; no business logic
    ├── models/            ← SQLAlchemy ORM models
    ├── schemas/           ← Pydantic request/response models
    └── utils/
        ├── auth.py        ← JWT + OAuth2 helpers
        ├── database.py    ← async engine + session factory (Supabase PostgreSQL)
        └── config.py      ← pydantic-settings for environment variable management
```

## System Boundaries & Guidelines

1. **API First:** Update `server/api-spec.md` before writing any route or repository code.
2. **Defensive Programming:** Treat all client inputs as hostile. All incoming data must pass through a Pydantic model before reaching service layer.
3. **Database Guardrails:** Never execute un-indexed queries. All schema changes use Alembic migration files.
4. **Wayfinding Benchmark:** The navigation service benchmarks against MappedIn wayfinding for route legibility, multi-stop ordering, and step guidance UX (https://developer.mappedin.com/docs/overview). MappedIn is a visual/interaction reference only — no runtime API dependency.

## Automated Execution Workflow

Implement in this incremental sequence to reduce bugs:

1. **Local, no API, no DB** — data models and Pydantic schemas only
2. **Local, API, no DB** — FastAPI routes returning hardcoded mock data
3. **Local, API, DB** — SQLAlchemy + Alembic migrations wired to local Supabase
4. **Cloud, API, DB** — deploy to cloud (Render/Railway — choose best free tier)
5. **Cloud, API, Auth, DB** — add JWT/OAuth2 and RBAC middleware

When processing feature assignments:
1. **Data Modeling:** Create or update Alembic migration files; run migrations
2. **API Endpoint Definition:** Stub controller routes and document in `server/api-spec.md`
3. **Business Logic:** Write services separating logic from infrastructure
4. **Unit Tests:** Write pytest tests alongside implementation code

## Definition of Done (DoD)

- Code passes mypy type checks and ruff linting with zero warnings
- API endpoints return appropriate HTTP status codes (200, 201, 400, 401, 403, 422, 500)
- Database queries do not cause N+1 bugs
- All new routes are documented in `server/api-spec.md` before merge
- FastAPI `/docs` reflects the current state of all routes
