"""Edge repository — SQLAlchemy async data access only. No business logic here."""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.edge import Edge


async def get_by_id(db: AsyncSession, edge_id: uuid.UUID) -> Edge | None:
    """Return the Edge with the given id, or None."""
    result = await db.execute(select(Edge).where(Edge.id == edge_id))
    return result.scalar_one_or_none()


async def get_by_layout(db: AsyncSession, layout_id: uuid.UUID) -> list[Edge]:
    """Return all edges for the given layout."""
    result = await db.execute(select(Edge).where(Edge.layout_id == layout_id))
    return list(result.scalars().all())


async def create(db: AsyncSession, layout_id: uuid.UUID, **fields: object) -> Edge:
    """Insert and return a new Edge row."""
    edge = Edge(layout_id=layout_id, **fields)
    db.add(edge)
    await db.flush()
    await db.refresh(edge)
    return edge


async def delete(db: AsyncSession, edge: Edge) -> None:
    """Delete the given edge row."""
    await db.delete(edge)
    await db.flush()
