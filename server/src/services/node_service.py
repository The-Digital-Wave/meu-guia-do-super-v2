"""Node service — business logic only. No direct DB queries; calls repository."""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.models.node import Node
from src.repositories import layout_repository, node_repository
from src.schemas.node import NodeCreate, NodeUpdate


async def list_nodes_for_layout(db: AsyncSession, layout_id: uuid.UUID) -> list[Node]:
    """Return all nodes for the given layout.

    Raises ValueError if the layout does not exist.
    """
    layout = await layout_repository.get_by_id(db, layout_id)
    if layout is None:
        raise ValueError(f"Layout {layout_id} not found")
    return await node_repository.get_by_layout(db, layout_id)


async def create_node(db: AsyncSession, layout_id: uuid.UUID, data: NodeCreate) -> Node:
    """Create a new node in the given layout.

    Raises ValueError if the layout does not exist.
    """
    layout = await layout_repository.get_by_id(db, layout_id)
    if layout is None:
        raise ValueError(f"Layout {layout_id} not found")
    return await node_repository.create(
        db,
        layout_id=layout_id,
        x=data.x,
        y=data.y,
        node_type=data.node_type,
        label=data.label,
    )


async def update_node(db: AsyncSession, node_id: uuid.UUID, data: NodeUpdate) -> Node:
    """Update an existing node.

    Raises ValueError if not found.
    """
    node = await node_repository.get_by_id(db, node_id)
    if node is None:
        raise ValueError(f"Node {node_id} not found")

    updates = data.model_dump(exclude_unset=True)
    return await node_repository.update(db, node, **updates)


async def delete_node(db: AsyncSession, node_id: uuid.UUID) -> None:
    """Delete a node by id.

    Raises ValueError if not found.
    """
    node = await node_repository.get_by_id(db, node_id)
    if node is None:
        raise ValueError(f"Node {node_id} not found")
    await node_repository.delete(db, node)
