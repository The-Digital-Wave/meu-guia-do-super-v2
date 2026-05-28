"""Shelves router — full CRUD."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers import shelf as shelf_controller
from src.database import get_db
from src.models.user import User
from src.schemas.shelf import ShelfCreate, ShelfOut, ShelfUpdate
from src.utils.auth import require_admin

router = APIRouter(prefix="/shelves", tags=["shelves"])


@router.get("", response_model=list[ShelfOut], status_code=status.HTTP_200_OK)
async def list_shelves(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[ShelfOut]:
    """List all shelves."""
    shelves = await shelf_controller.list_shelves(db)
    return [ShelfOut.model_validate(s) for s in shelves]


@router.get("/{shelf_id}", response_model=ShelfOut, status_code=status.HTTP_200_OK)
async def get_shelf(
    shelf_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ShelfOut:
    """Get a shelf by id."""
    shelf = await shelf_controller.get_shelf(db, shelf_id)
    return ShelfOut.model_validate(shelf)


@router.post("", response_model=ShelfOut, status_code=status.HTTP_201_CREATED)
async def create_shelf(
    payload: ShelfCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_admin)],
) -> ShelfOut:
    """Create a new shelf. Admin only."""
    shelf = await shelf_controller.create_shelf(payload, db)
    return ShelfOut.model_validate(shelf)


@router.put("/{shelf_id}", response_model=ShelfOut, status_code=status.HTTP_200_OK)
async def update_shelf(
    shelf_id: uuid.UUID,
    payload: ShelfUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_admin)],
) -> ShelfOut:
    """Update a shelf. Admin only."""
    shelf = await shelf_controller.update_shelf(shelf_id, payload, db)
    return ShelfOut.model_validate(shelf)


@router.delete("/{shelf_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shelf(
    shelf_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_admin)],
) -> Response:
    """Delete a shelf. Admin only."""
    await shelf_controller.delete_shelf(shelf_id, db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
