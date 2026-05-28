"""Shared fixtures for server integration tests.

Uses SQLite in-memory (aiosqlite) so no real Postgres is required.
The SQLAlchemy models use postgresql.UUID and SAEnum — both work transparently
in SQLite with the settings chosen here.
"""
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import src.models.edge  # noqa: F401
import src.models.grocery_list  # noqa: F401
import src.models.layout  # noqa: F401
import src.models.node  # noqa: F401
import src.models.product  # noqa: F401
import src.models.shelf  # noqa: F401
import src.models.supermarket  # noqa: F401
import src.models.user  # noqa: F401

# Import all models so Base.metadata is fully populated before create_all.
from src.database import get_db
from src.main import app
from src.models.base import Base

_SQLITE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture()
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh SQLite in-memory DB per test, yield a session, then tear down."""
    engine = create_async_engine(
        _SQLITE_URL,
        connect_args={"check_same_thread": False},
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session
        # Roll back any uncommitted transaction so teardown is clean.
        await session.rollback()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture()
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Return an AsyncClient wired to the FastAPI app with the test DB."""

    async def _override_get_db() -> AsyncGenerator[AsyncSession, None]:
        try:
            yield db_session
            await db_session.commit()
        except Exception:
            await db_session.rollback()
            raise

    app.dependency_overrides[get_db] = _override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app),  # type: ignore[arg-type]
        base_url="http://test",
    ) as ac:
        yield ac
    app.dependency_overrides.clear()
