"""Layout service — business logic only. No direct DB queries; calls repository."""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.models.layout import Layout
from src.repositories import layout_repository
from src.schemas.layout import LayoutCreate, LayoutUpdate


async def list_layouts(
    db: AsyncSession, supermarket_id: uuid.UUID | None = None
) -> list[Layout]:
    """Return all layouts, optionally filtered by supermarket_id."""
    if supermarket_id is not None:
        return await layout_repository.get_by_supermarket(db, supermarket_id)
    return await layout_repository.get_all(db)


async def get_layout(db: AsyncSession, layout_id: uuid.UUID) -> Layout:
    """Return the layout by id.

    Raises ValueError if not found.
    """
    layout = await layout_repository.get_by_id(db, layout_id)
    if layout is None:
        raise ValueError(f"Layout {layout_id} not found")
    return layout


async def create_layout(db: AsyncSession, data: LayoutCreate) -> Layout:
    """Create a new layout from validated input data."""
    return await layout_repository.create(
        db,
        supermarket_id=data.supermarket_id,
        name=data.name,
        width_m=data.width_m,
        height_m=data.height_m,
        image_url=data.image_url,
    )


async def update_layout(db: AsyncSession, layout_id: uuid.UUID, data: LayoutUpdate) -> Layout:
    """Update an existing layout.

    Raises ValueError if not found.
    """
    layout = await layout_repository.get_by_id(db, layout_id)
    if layout is None:
        raise ValueError(f"Layout {layout_id} not found")

    # Only update fields that were explicitly provided
    updates = data.model_dump(exclude_unset=True)
    return await layout_repository.update(db, layout, **updates)


async def delete_layout(db: AsyncSession, layout_id: uuid.UUID) -> None:
    """Delete a layout by id.

    Raises ValueError if not found.
    """
    layout = await layout_repository.get_by_id(db, layout_id)
    if layout is None:
        raise ValueError(f"Layout {layout_id} not found")
    await layout_repository.delete(db, layout)


async def get_layout_with_shelves(db: AsyncSession, layout_id: uuid.UUID) -> dict:
    """Return layout and its shelves as a dict.

    Raises ValueError if not found.
    """
    layout = await layout_repository.get_with_shelves(db, layout_id)
    if layout is None:
        raise ValueError(f"Layout {layout_id} not found")
    return {"layout": layout, "shelves": layout.shelves}


async def download_layout(db: AsyncSession, layout_id: uuid.UUID) -> dict:
    """Return a full offline bundle: layout + nodes + edges + shelves + products.

    Raises ValueError if not found.
    """
    bundle = await layout_repository.get_full_bundle(db, layout_id)
    if bundle is None:
        raise ValueError(f"Layout {layout_id} not found")
    return bundle
