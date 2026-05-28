"""Grocery list controller — input extraction, delegates to grocery_list_service, maps errors."""
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.grocery_list import GroceryList, GroceryListItem
from src.models.user import User
from src.schemas.grocery_list import GroceryListCreate, GroceryListItemCreate, GroceryListItemUpdate
from src.services import grocery_list_service


async def list_grocery_lists(db: AsyncSession, user: User) -> list[GroceryList]:
    return await grocery_list_service.list_grocery_lists(db, user)


async def get_grocery_list(db: AsyncSession, list_id: uuid.UUID, user: User) -> GroceryList:
    try:
        return await grocery_list_service.get_grocery_list(db, list_id, user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


async def create_grocery_list(
    data: GroceryListCreate, db: AsyncSession, user: User
) -> GroceryList:
    return await grocery_list_service.create_grocery_list(db, data, user)


async def delete_grocery_list(
    list_id: uuid.UUID, db: AsyncSession, user: User
) -> None:
    try:
        await grocery_list_service.delete_grocery_list(db, list_id, user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


async def add_item(
    list_id: uuid.UUID, data: GroceryListItemCreate, db: AsyncSession, user: User
) -> GroceryListItem:
    try:
        return await grocery_list_service.add_item(db, list_id, data, user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


async def update_item(
    list_id: uuid.UUID,
    item_id: uuid.UUID,
    data: GroceryListItemUpdate,
    db: AsyncSession,
    user: User,
) -> GroceryListItem:
    try:
        return await grocery_list_service.update_item(db, list_id, item_id, data, user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


async def delete_item(
    list_id: uuid.UUID, item_id: uuid.UUID, db: AsyncSession, user: User
) -> None:
    try:
        await grocery_list_service.delete_item(db, list_id, item_id, user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


async def optimize_grocery_list(
    list_id: uuid.UUID, db: AsyncSession, user: User
) -> GroceryList:
    """Optimise grocery list item order via TSP wayfinding. Maps errors to HTTP codes."""
    try:
        return await grocery_list_service.optimize_grocery_list(db, list_id, user)
    except ValueError as exc:
        msg = str(exc)
        if "no layout_id" in msg or "no entry node" in msg.lower() or "has no entry" in msg.lower():
            raise HTTPException(status_code=422, detail=msg)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=msg)
