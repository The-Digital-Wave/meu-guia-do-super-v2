from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from sqlalchemy import text

from src.database import AsyncSessionLocal, engine


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


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, Any]:
    """Health check endpoint. Returns DB connectivity status."""
    db_connected = getattr(app.state, "db_connected", False)

    if db_connected:
        # Re-verify live connection
        try:
            async with AsyncSessionLocal() as session:
                await session.execute(text("SELECT 1"))
            return {"status": "ok", "db": "connected"}
        except Exception:
            return {"status": "error", "db": "disconnected"}

    return {"status": "error", "db": "disconnected"}
