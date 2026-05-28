"""Grocery list service — business logic only. No direct DB queries; calls repository."""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.models.grocery_list import GroceryList, GroceryListItem
from src.models.user import User
from src.repositories import grocery_list_repository
from src.schemas.grocery_list import GroceryListCreate, GroceryListItemCreate, GroceryListItemUpdate


async def list_grocery_lists(db: AsyncSession, user: User) -> list[GroceryList]:
    """Return all grocery lists for the authenticated user."""
    return await grocery_list_repository.get_all_for_user(db, user.id)


async def get_grocery_list(db: AsyncSession, list_id: uuid.UUID, user: User) -> GroceryList:
    """Return a grocery list by id with ownership check.

    Raises ValueError if not found or if the list does not belong to the user.
    """
    grocery_list = await grocery_list_repository.get_with_items(db, list_id)
    if grocery_list is None:
        raise ValueError(f"Grocery list {list_id} not found")
    if grocery_list.user_id != user.id:
        raise ValueError(f"Grocery list {list_id} not found")
    return grocery_list


async def create_grocery_list(
    db: AsyncSession, data: GroceryListCreate, user: User
) -> GroceryList:
    """Create a new grocery list for the authenticated user."""
    return await grocery_list_repository.create(
        db,
        user_id=user.id,
        layout_id=data.layout_id,
        name=data.name,
    )


async def delete_grocery_list(
    db: AsyncSession, list_id: uuid.UUID, user: User
) -> None:
    """Delete a grocery list by id with ownership check.

    Raises ValueError if not found or not owned by the user.
    """
    grocery_list = await grocery_list_repository.get_by_id(db, list_id)
    if grocery_list is None:
        raise ValueError(f"Grocery list {list_id} not found")
    if grocery_list.user_id != user.id:
        raise ValueError(f"Grocery list {list_id} not found")
    await grocery_list_repository.delete(db, grocery_list)


async def add_item(
    db: AsyncSession,
    list_id: uuid.UUID,
    data: GroceryListItemCreate,
    user: User,
) -> GroceryListItem:
    """Add an item to a grocery list. Validates ownership of the list.

    Raises ValueError if list not found or not owned by user.
    """
    grocery_list = await grocery_list_repository.get_by_id(db, list_id)
    if grocery_list is None:
        raise ValueError(f"Grocery list {list_id} not found")
    if grocery_list.user_id != user.id:
        raise ValueError(f"Grocery list {list_id} not found")

    if data.product_id is not None:
        from src.repositories import product_repository
        product = await product_repository.get_by_id(db, data.product_id)
        if product is None:
            raise ValueError(f"Product {data.product_id} not found")

    return await grocery_list_repository.create_item(
        db,
        list_id=list_id,
        product_id=data.product_id,
        product_name_snapshot=data.product_name_snapshot,
    )


async def update_item(
    db: AsyncSession,
    list_id: uuid.UUID,
    item_id: uuid.UUID,
    data: GroceryListItemUpdate,
    user: User,
) -> GroceryListItem:
    """Update an item in a grocery list. Validates ownership of the parent list.

    Raises ValueError if list or item not found, or list not owned by user.
    """
    grocery_list = await grocery_list_repository.get_by_id(db, list_id)
    if grocery_list is None:
        raise ValueError(f"Grocery list {list_id} not found")
    if grocery_list.user_id != user.id:
        raise ValueError(f"Grocery list {list_id} not found")

    item = await grocery_list_repository.get_item(db, item_id)
    if item is None or item.list_id != list_id:
        raise ValueError(f"Item {item_id} not found in grocery list {list_id}")

    updates = data.model_dump(exclude_unset=True)
    return await grocery_list_repository.update_item(db, item, **updates)


async def delete_item(
    db: AsyncSession,
    list_id: uuid.UUID,
    item_id: uuid.UUID,
    user: User,
) -> None:
    """Delete an item from a grocery list. Validates ownership of the parent list.

    Raises ValueError if list or item not found, or list not owned by user.
    """
    grocery_list = await grocery_list_repository.get_by_id(db, list_id)
    if grocery_list is None:
        raise ValueError(f"Grocery list {list_id} not found")
    if grocery_list.user_id != user.id:
        raise ValueError(f"Grocery list {list_id} not found")

    item = await grocery_list_repository.get_item(db, item_id)
    if item is None or item.list_id != list_id:
        raise ValueError(f"Item {item_id} not found in grocery list {list_id}")

    await grocery_list_repository.delete_item(db, item)
