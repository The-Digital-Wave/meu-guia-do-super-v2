import asyncio
import os
import sys
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context

# ── Make src/ importable ──────────────────────────────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# ── Import all models so Alembic can detect them for autogenerate ─────────────
from src.models import (  # noqa: F401  (imported for side-effects / metadata registration)
    Base,  # noqa: E402  (must come after sys.path adjustment)
    Edge,
    GroceryList,
    GroceryListItem,
    Layout,
    Node,
    Product,
    Shelf,
    Supermarket,
    User,
)

# ── Alembic config object ─────────────────────────────────────────────────────
config = context.config

# Interpret the config file for Python logging. This line sets up loggers.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata for autogenerate support
target_metadata = Base.metadata


def get_url() -> str:
    """Resolve DATABASE_URL from environment, falling back to alembic.ini."""
    from src.config import settings  # local import to avoid circular deps at module level

    return settings.DATABASE_URL


# ── Offline migrations (generate SQL without a live DB) ──────────────────────
def run_migrations_offline() -> None:
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


# ── Online migrations (async) ─────────────────────────────────────────────────
def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Create an async engine and run migrations inside a sync-compatible context."""
    connectable = create_async_engine(get_url(), poolclass=pool.NullPool)

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


# ── Entry point ───────────────────────────────────────────────────────────────
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
