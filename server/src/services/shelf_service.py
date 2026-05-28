"""Shelf service — business logic only. No direct DB queries; calls repository."""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.models.shelf import Shelf
from src.repositories import layout_repository, node_repository, shelf_repository
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
    """Create a new shelf from validated input data.

    Validates that:
    1. The layout exists
    2. If a node_id is provided, the node exists and belongs to the layout
    """
    # Validate layout exists
    layout = await layout_repository.get_by_id(db, data.layout_id)
    if layout is None:
        raise ValueError(f"Layout {data.layout_id} not found")

    # Validate node exists and belongs to this layout if provided
    if data.node_id is not None:
        node = await node_repository.get_by_id(db, data.node_id)
        if node is None or node.layout_id != data.layout_id:
            raise ValueError(f"Node {data.node_id} does not belong to layout {data.layout_id}")

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
