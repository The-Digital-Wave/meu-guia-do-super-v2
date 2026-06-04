"""Supermarket controller — validates input, delegates to service, maps errors to HTTP."""
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.supermarket import Supermarket
from src.services import supermarket_service


async def list_supermarkets(db: AsyncSession) -> list[Supermarket]:
    """Return all active supermarkets."""
    return await supermarket_service.list_active_supermarkets(db)


async def get_supermarket(db: AsyncSession, supermarket_id: uuid.UUID) -> Supermarket:
    """Return a single supermarket by id; raises 404 if not found."""
    try:
        return await supermarket_service.get_supermarket(db, supermarket_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
