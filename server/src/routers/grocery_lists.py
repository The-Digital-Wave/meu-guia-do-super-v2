"""Grocery lists router — full CRUD + items management."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers import grocery_list as grocery_list_controller
from src.database import get_db
from src.models.user import User
from src.schemas.grocery_list import (
    GroceryListCreate,
    GroceryListItemCreate,
    GroceryListItemOut,
    GroceryListItemUpdate,
    GroceryListOut,
    GroceryListWithItemsOut,
)
from src.utils.auth import get_current_user

router = APIRouter(prefix="/grocery-lists", tags=["grocery-lists"])


@router.get("", response_model=list[GroceryListOut], status_code=status.HTTP_200_OK)
async def list_grocery_lists(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[GroceryListOut]:
    """List all grocery lists for the authenticated user."""
    lists = await grocery_list_controller.list_grocery_lists(db, current_user)
    return [GroceryListOut.model_validate(gl) for gl in lists]


@router.post("", response_model=GroceryListOut, status_code=status.HTTP_201_CREATED)
async def create_grocery_list(
    payload: GroceryListCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> GroceryListOut:
    """Create a new grocery list for the authenticated user."""
    grocery_list = await grocery_list_controller.create_grocery_list(payload, db, current_user)
    return GroceryListOut.model_validate(grocery_list)


@router.get(
    "/{list_id}",
    response_model=GroceryListWithItemsOut,
    status_code=status.HTTP_200_OK,
)
async def get_grocery_list(
    list_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> GroceryListWithItemsOut:
    """Get a grocery list with its items. Ownership required."""
    grocery_list = await grocery_list_controller.get_grocery_list(db, list_id, current_user)
    return GroceryListWithItemsOut.model_validate(grocery_list)


@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_grocery_list(
    list_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Response:
    """Delete a grocery list. Ownership required."""
    await grocery_list_controller.delete_grocery_list(list_id, db, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{list_id}/items",
    response_model=GroceryListItemOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_item(
    list_id: uuid.UUID,
    payload: GroceryListItemCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> GroceryListItemOut:
    """Add an item to a grocery list. Ownership required."""
    item = await grocery_list_controller.add_item(list_id, payload, db, current_user)
    return GroceryListItemOut.model_validate(item)


@router.put(
    "/{list_id}/items/{item_id}",
    response_model=GroceryListItemOut,
    status_code=status.HTTP_200_OK,
)
async def update_item(
    list_id: uuid.UUID,
    item_id: uuid.UUID,
    payload: GroceryListItemUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> GroceryListItemOut:
    """Update an item in a grocery list. Ownership required."""
    item = await grocery_list_controller.update_item(list_id, item_id, payload, db, current_user)
    return GroceryListItemOut.model_validate(item)


@router.delete("/{list_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    list_id: uuid.UUID,
    item_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Response:
    """Delete an item from a grocery list. Ownership required."""
    await grocery_list_controller.delete_item(list_id, item_id, db, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{list_id}/optimize", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def optimize_grocery_list(
    list_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    """Optimize grocery list route order. Phase 3 stub."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Route optimization not implemented yet — coming in Phase 3",
    )
