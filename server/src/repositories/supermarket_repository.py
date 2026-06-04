"""Supermarket repository — SQLAlchemy async data access only. No business logic here."""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.supermarket import Supermarket


async def get_all_active(db: AsyncSession) -> list[Supermarket]:
    """Return all active supermarkets ordered by name."""
    result = await db.execute(
        select(Supermarket).where(Supermarket.is_active.is_(True)).order_by(Supermarket.name)
    )
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, supermarket_id: uuid.UUID) -> Supermarket | None:
    """Return the Supermarket with the given id (with layouts eager-loaded), or None."""
    result = await db.execute(
        select(Supermarket)
        .options(selectinload(Supermarket.layouts))
        .where(Supermarket.id == supermarket_id, Supermarket.is_active.is_(True))
    )
    return result.scalar_one_or_none()
