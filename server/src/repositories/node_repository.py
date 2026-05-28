"""Node repository — SQLAlchemy async data access only. No business logic here."""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.node import Node


async def get_by_id(db: AsyncSession, node_id: uuid.UUID) -> Node | None:
    """Return the Node with the given id, or None."""
    result = await db.execute(select(Node).where(Node.id == node_id))
    return result.scalar_one_or_none()


async def get_by_layout(db: AsyncSession, layout_id: uuid.UUID) -> list[Node]:
    """Return all nodes for the given layout."""
    result = await db.execute(select(Node).where(Node.layout_id == layout_id))
    return list(result.scalars().all())


async def create(db: AsyncSession, layout_id: uuid.UUID, **fields: object) -> Node:
    """Insert and return a new Node row."""
    node = Node(layout_id=layout_id, **fields)
    db.add(node)
    await db.flush()
    await db.refresh(node)
    return node


async def update(db: AsyncSession, node: Node, **fields: object) -> Node:
    """Apply keyword-argument field updates to the node and flush."""
    for key, value in fields.items():
        setattr(node, key, value)
    await db.flush()
    await db.refresh(node)
    return node


async def delete(db: AsyncSession, node: Node) -> None:
    """Delete the given node row."""
    await db.delete(node)
    await db.flush()
