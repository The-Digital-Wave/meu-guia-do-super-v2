"""Supermarket service — business logic only. No direct DB queries; calls repository."""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.models.supermarket import Supermarket
from src.repositories import supermarket_repository


async def list_active_supermarkets(db: AsyncSession) -> list[Supermarket]:
    """Return all active supermarkets."""
    return await supermarket_repository.get_all_active(db)


async def get_supermarket(db: AsyncSession, supermarket_id: uuid.UUID) -> Supermarket:
    """Return the supermarket by id.

    Raises ValueError if not found.
    """
    supermarket = await supermarket_repository.get_by_id(db, supermarket_id)
    if supermarket is None:
        raise ValueError(f"Supermarket {supermarket_id} not found")
    return supermarket
