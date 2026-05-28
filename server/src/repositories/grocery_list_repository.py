"""Grocery list repository — SQLAlchemy async data access only. No business logic here."""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.grocery_list import GroceryList, GroceryListItem


async def get_all_for_user(db: AsyncSession, user_id: uuid.UUID) -> list[GroceryList]:
    """Return all grocery lists belonging to the given user."""
    result = await db.execute(select(GroceryList).where(GroceryList.user_id == user_id))
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, list_id: uuid.UUID) -> GroceryList | None:
    """Return the GroceryList with the given id, or None."""
    result = await db.execute(select(GroceryList).where(GroceryList.id == list_id))
    return result.scalar_one_or_none()


async def get_with_items(db: AsyncSession, list_id: uuid.UUID) -> GroceryList | None:
    """Return the GroceryList with eagerly loaded items, or None."""
    result = await db.execute(
        select(GroceryList)
        .where(GroceryList.id == list_id)
        .options(selectinload(GroceryList.items))
    )
    return result.scalar_one_or_none()


async def create(
    db: AsyncSession,
    user_id: uuid.UUID,
    layout_id: uuid.UUID | None,
    name: str,
) -> GroceryList:
    """Insert and return a new GroceryList row."""
    grocery_list = GroceryList(user_id=user_id, layout_id=layout_id, name=name)
    db.add(grocery_list)
    await db.flush()
    await db.refresh(grocery_list)
    return grocery_list


async def delete(db: AsyncSession, grocery_list: GroceryList) -> None:
    """Delete the given grocery list row."""
    await db.delete(grocery_list)
    await db.flush()


async def create_item(
    db: AsyncSession,
    list_id: uuid.UUID,
    product_id: uuid.UUID | None,
    product_name_snapshot: str,
) -> GroceryListItem:
    """Insert and return a new GroceryListItem row."""
    item = GroceryListItem(
        list_id=list_id,
        product_id=product_id,
        product_name_snapshot=product_name_snapshot,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


async def get_item(db: AsyncSession, item_id: uuid.UUID) -> GroceryListItem | None:
    """Return the GroceryListItem with the given id, or None."""
    result = await db.execute(
        select(GroceryListItem).where(GroceryListItem.id == item_id)
    )
    return result.scalar_one_or_none()


async def update_item(
    db: AsyncSession, item: GroceryListItem, **fields: object
) -> GroceryListItem:
    """Apply keyword-argument field updates to the item and flush."""
    for key, value in fields.items():
        setattr(item, key, value)
    await db.flush()
    await db.refresh(item)
    return item


async def delete_item(db: AsyncSession, item: GroceryListItem) -> None:
    """Delete the given grocery list item row."""
    await db.delete(item)
    await db.flush()
