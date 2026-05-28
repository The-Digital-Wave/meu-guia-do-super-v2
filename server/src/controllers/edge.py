"""Edge controller — extracts validated input, delegates to edge_service, maps errors."""
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.services import edge_service


async def delete_edge(edge_id: uuid.UUID, db: AsyncSession) -> None:
    try:
        await edge_service.delete_edge(db, edge_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
