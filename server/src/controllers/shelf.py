"""Shelf controller — extracts validated input, delegates to shelf_service, maps errors."""
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.shelf import Shelf
from src.schemas.shelf import ShelfCreate, ShelfUpdate
from src.services import shelf_service


async def list_shelves(db: AsyncSession) -> list[Shelf]:
    return await shelf_service.list_shelves(db)


async def get_shelf(db: AsyncSession, shelf_id: uuid.UUID) -> Shelf:
    try:
        return await shelf_service.get_shelf(db, shelf_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


async def create_shelf(data: ShelfCreate, db: AsyncSession) -> Shelf:
    return await shelf_service.create_shelf(db, data)


async def update_shelf(shelf_id: uuid.UUID, data: ShelfUpdate, db: AsyncSession) -> Shelf:
    try:
        return await shelf_service.update_shelf(db, shelf_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


async def delete_shelf(shelf_id: uuid.UUID, db: AsyncSession) -> None:
    try:
        await shelf_service.delete_shelf(db, shelf_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
