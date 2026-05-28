"""Nodes router — PUT and DELETE only (GET/POST live under /layouts/{id}/nodes)."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers import node as node_controller
from src.database import get_db
from src.models.user import User
from src.schemas.node import NodeOut, NodeUpdate
from src.utils.auth import require_admin

router = APIRouter(prefix="/nodes", tags=["nodes"])


@router.put("/{node_id}", response_model=NodeOut, status_code=status.HTTP_200_OK)
async def update_node(
    node_id: uuid.UUID,
    payload: NodeUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_admin)],
) -> NodeOut:
    """Update a node. Admin only."""
    node = await node_controller.update_node(node_id, payload, db)
    return NodeOut.model_validate(node)


@router.delete("/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_node(
    node_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_admin)],
) -> Response:
    """Delete a node. Admin only."""
    await node_controller.delete_node(node_id, db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
