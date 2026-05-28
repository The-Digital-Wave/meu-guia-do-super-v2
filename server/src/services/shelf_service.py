"""Shelf service — business logic only. No direct DB queries; calls repository."""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.models.shelf import Shelf
from src.repositories import shelf_repository
from src.schemas.shelf import ShelfCreate, ShelfUpdate


async def list_shelves(db: AsyncSession) -> list[Shelf]:
    """Return all shelves."""
    return await shelf_repository.get_all(db)


async def get_shelf(db: AsyncSession, shelf_id: uuid.UUID) -> Shelf:
    """Return the shelf by id.

    Raises ValueError if not found.
    """
    shelf = await shelf_repository.get_by_id(db, shelf_id)
    if shelf is None:
        raise ValueError(f"Shelf {shelf_id} not found")
    return shelf


async def create_shelf(db: AsyncSession, data: ShelfCreate) -> Shelf:
    """Create a new shelf from validated input data."""
    return await shelf_repository.create(
        db,
        layout_id=data.layout_id,
        node_id=data.node_id,
        aisle=data.aisle,
        section=data.section,
        label=data.label,
        x=data.x,
        y=data.y,
        width=data.width,
        height=data.height,
        color=data.color,
    )


async def update_shelf(db: AsyncSession, shelf_id: uuid.UUID, data: ShelfUpdate) -> Shelf:
    """Update an existing shelf.

    Raises ValueError if not found.
    """
    shelf = await shelf_repository.get_by_id(db, shelf_id)
    if shelf is None:
        raise ValueError(f"Shelf {shelf_id} not found")

    updates = data.model_dump(exclude_unset=True)
    return await shelf_repository.update(db, shelf, **updates)


async def delete_shelf(db: AsyncSession, shelf_id: uuid.UUID) -> None:
    """Delete a shelf by id.

    Raises ValueError if not found.
    """
    shelf = await shelf_repository.get_by_id(db, shelf_id)
    if shelf is None:
        raise ValueError(f"Shelf {shelf_id} not found")
    await shelf_repository.delete(db, shelf)
