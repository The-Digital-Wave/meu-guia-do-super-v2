import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from src.config import settings
from src.database import AsyncSessionLocal, engine
from src.redis_client import connect_redis, disconnect_redis
from src.routers import (
    auth,
    edges,
    grocery_lists,
    layouts,
    navigation,
    nodes,
    products,
    shelves,
    users,
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[type-arg]
    """Application lifespan: verify DB and Redis on startup, clean up on shutdown."""
    # Startup: verify database connection
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        app.state.db_connected = True
    except Exception:
        app.state.db_connected = False

    # Startup: connect Redis (non-fatal — caching is optional for MVP)
    try:
        await connect_redis()
        app.state.redis_connected = True
    except Exception as exc:
        logger.warning("Redis unavailable on startup (non-fatal): %s", exc)
        app.state.redis_connected = False

    yield

    # Shutdown: close Redis connection
    await disconnect_redis()

    # Shutdown: dispose the DB connection pool
    await engine.dispose()


app = FastAPI(
    title="Meu Guia do Super API",
    version="1.0.0",
    description=(
        "Backend API for Meu Guia do Super — a retail indoor navigation app. "
        "Shoppers can search for products and get turn-by-turn navigation guidance."
    ),
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
_API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=_API_PREFIX)
app.include_router(users.router, prefix=_API_PREFIX)
app.include_router(layouts.router, prefix=_API_PREFIX)
app.include_router(shelves.router, prefix=_API_PREFIX)
app.include_router(products.router, prefix=_API_PREFIX)
app.include_router(nodes.router, prefix=_API_PREFIX)
app.include_router(edges.router, prefix=_API_PREFIX)
app.include_router(grocery_lists.router, prefix=_API_PREFIX)
app.include_router(navigation.router, prefix=_API_PREFIX)


# ---------------------------------------------------------------------------
# Health check (no prefix — infra/load-balancer friendly)
# ---------------------------------------------------------------------------

@app.get("/health", tags=["Health"], response_model=None)
async def health_check() -> dict[str, Any] | JSONResponse:
    """Health check endpoint. Returns DB and Redis connectivity status.

    HTTP 200 — DB is reachable (Redis is non-critical; its status is informational).
    HTTP 503 — DB is unreachable.
    """
    db_connected = getattr(app.state, "db_connected", False)
    redis_status = "connected" if getattr(app.state, "redis_connected", False) else "disconnected"

    if db_connected:
        # Re-verify live DB connection
        try:
            async with AsyncSessionLocal() as session:
                await session.execute(text("SELECT 1"))
            return {"status": "ok", "db": "connected", "redis": redis_status}
        except Exception:
            return JSONResponse(
                status_code=503,
                content={"status": "error", "db": "disconnected", "redis": redis_status},
            )

    return JSONResponse(
        status_code=503,
        content={"status": "error", "db": "disconnected", "redis": redis_status},
    )
