"""Edge service — business logic only. No direct DB queries; calls repository."""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.models.edge import Edge
from src.repositories import edge_repository, layout_repository, node_repository
from src.schemas.edge import EdgeCreate


async def list_edges_for_layout(db: AsyncSession, layout_id: uuid.UUID) -> list[Edge]:
    """Return all edges for the given layout.

    Raises ValueError if the layout does not exist.
    """
    layout = await layout_repository.get_by_id(db, layout_id)
    if layout is None:
        raise ValueError(f"Layout {layout_id} not found")
    return await edge_repository.get_by_layout(db, layout_id)


async def create_edge(db: AsyncSession, layout_id: uuid.UUID, data: EdgeCreate) -> Edge:
    """Create a new edge in the given layout.

    Raises ValueError if layout or referenced nodes do not exist, or if nodes
    belong to a different layout.
    """
    layout = await layout_repository.get_by_id(db, layout_id)
    if layout is None:
        raise ValueError(f"Layout {layout_id} not found")

    node_from = await node_repository.get_by_id(db, data.node_from_id)
    if node_from is None:
        raise ValueError(f"Node {data.node_from_id} not found")
    if node_from.layout_id != layout_id:
        raise ValueError(f"Node {data.node_from_id} does not belong to layout {layout_id}")

    node_to = await node_repository.get_by_id(db, data.node_to_id)
    if node_to is None:
        raise ValueError(f"Node {data.node_to_id} not found")
    if node_to.layout_id != layout_id:
        raise ValueError(f"Node {data.node_to_id} does not belong to layout {layout_id}")

    return await edge_repository.create(
        db,
        layout_id=layout_id,
        node_from_id=data.node_from_id,
        node_to_id=data.node_to_id,
        distance_m=data.distance_m,
        bidirectional=data.bidirectional,
    )


async def delete_edge(db: AsyncSession, edge_id: uuid.UUID) -> None:
    """Delete an edge by id.

    Raises ValueError if not found.
    """
    edge = await edge_repository.get_by_id(db, edge_id)
    if edge is None:
        raise ValueError(f"Edge {edge_id} not found")
    await edge_repository.delete(db, edge)
