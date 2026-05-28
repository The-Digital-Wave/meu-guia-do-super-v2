"""Edges router — DELETE only (GET/POST live under /layouts/{id}/edges)."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers import edge as edge_controller
from src.database import get_db
from src.models.user import User
from src.utils.auth import require_admin

router = APIRouter(prefix="/edges", tags=["edges"])


@router.delete("/{edge_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_edge(
    edge_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_admin)],
) -> Response:
    """Delete an edge. Admin only."""
    await edge_controller.delete_edge(edge_id, db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
