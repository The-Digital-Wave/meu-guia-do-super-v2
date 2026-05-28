from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy import text

from src.database import AsyncSessionLocal, engine
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


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[type-arg]
    """Application lifespan: verify DB on startup, dispose engine on shutdown."""
    # Startup: verify database connection
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        app.state.db_connected = True
    except Exception:
        app.state.db_connected = False

    yield

    # Shutdown: dispose the connection pool
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
    """Health check endpoint. Returns DB connectivity status."""
    db_connected = getattr(app.state, "db_connected", False)

    if db_connected:
        # Re-verify live connection
        try:
            async with AsyncSessionLocal() as session:
                await session.execute(text("SELECT 1"))
            return {"status": "ok", "db": "connected"}
        except Exception:
            return JSONResponse(
                status_code=503,
                content={"status": "error", "db": "disconnected"}
            )

    return JSONResponse(
        status_code=503,
        content={"status": "error", "db": "disconnected"}
    )
