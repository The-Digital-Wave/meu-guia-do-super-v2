"""Supermarkets router — public read-only endpoints."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers import supermarket as supermarket_controller
from src.database import get_db
from src.schemas.supermarket import SupermarketDetailOut, SupermarketOut

router = APIRouter(prefix="/supermarkets", tags=["supermarkets"])


@router.get("", response_model=list[SupermarketOut], status_code=status.HTTP_200_OK)
async def list_supermarkets(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[SupermarketOut]:
    """List all active supermarkets."""
    supermarkets = await supermarket_controller.list_supermarkets(db)
    return [SupermarketOut.model_validate(sm) for sm in supermarkets]


@router.get(
    "/{supermarket_id}",
    response_model=SupermarketDetailOut,
    status_code=status.HTTP_200_OK,
)
async def get_supermarket(
    supermarket_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SupermarketDetailOut:
    """Get a single supermarket with its layouts."""
    supermarket = await supermarket_controller.get_supermarket(db, supermarket_id)
    return SupermarketDetailOut.model_validate(supermarket)
