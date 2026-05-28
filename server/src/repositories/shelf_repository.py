"""Shelf repository — SQLAlchemy async data access only. No business logic here."""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.shelf import Shelf


async def get_all(db: AsyncSession) -> list[Shelf]:
    """Return all shelves."""
    result = await db.execute(select(Shelf))
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, shelf_id: uuid.UUID) -> Shelf | None:
    """Return the Shelf with the given id, or None."""
    result = await db.execute(select(Shelf).where(Shelf.id == shelf_id))
    return result.scalar_one_or_none()


async def get_by_layout(db: AsyncSession, layout_id: uuid.UUID) -> list[Shelf]:
    """Return all shelves for the given layout."""
    result = await db.execute(select(Shelf).where(Shelf.layout_id == layout_id))
    return list(result.scalars().all())


async def create(db: AsyncSession, **fields: object) -> Shelf:
    """Insert and return a new Shelf row."""
    shelf = Shelf(**fields)
    db.add(shelf)
    await db.flush()
    await db.refresh(shelf)
    return shelf


async def update(db: AsyncSession, shelf: Shelf, **fields: object) -> Shelf:
    """Apply keyword-argument field updates to the shelf and flush."""
    for key, value in fields.items():
        setattr(shelf, key, value)
    await db.flush()
    await db.refresh(shelf)
    return shelf


async def delete(db: AsyncSession, shelf: Shelf) -> None:
    """Delete the given shelf row."""
    await db.delete(shelf)
    await db.flush()
