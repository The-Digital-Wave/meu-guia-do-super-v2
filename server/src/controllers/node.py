"""Node controller — extracts validated input, delegates to node_service, maps errors."""
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.node import Node
from src.schemas.node import NodeUpdate
from src.services import node_service


async def update_node(node_id: uuid.UUID, data: NodeUpdate, db: AsyncSession) -> Node:
    try:
        return await node_service.update_node(db, node_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


async def delete_node(node_id: uuid.UUID, db: AsyncSession) -> None:
    try:
        await node_service.delete_node(db, node_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
