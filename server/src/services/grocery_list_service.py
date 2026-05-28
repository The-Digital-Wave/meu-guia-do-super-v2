"""Grocery list service — business logic only. No direct DB queries; calls repository."""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.grocery_list import GroceryList, GroceryListItem
from src.models.node import Node, NodeType
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


async def optimize_grocery_list(
    db: AsyncSession,
    list_id: uuid.UUID,
    user: User,
) -> GroceryList:
    """Reorder grocery list items using nearest-neighbor TSP via the navigation service.

    Flow:
    1. Load the grocery list (verify ownership).
    2. Require a layout_id on the list — raise ValueError if absent.
    3. Find the first ENTRY node of the layout as the start position.
    4. Collect product_ids from items (skip items with null product_id).
    5. Delegate ordering to navigation_service.optimize_list_order().
    6. Update sort_order on each item to reflect the new order.
    7. Return the updated list with items eagerly loaded.

    Raises ValueError on ownership failure, missing layout, or missing ENTRY node.
    """
    from src.services import navigation_service  # local import avoids circular deps

    # Step 1 — load and authorise
    grocery_list = await grocery_list_repository.get_with_items(db, list_id)
    if grocery_list is None:
        raise ValueError(f"Grocery list {list_id} not found")
    if grocery_list.user_id != user.id:
        raise ValueError(f"Grocery list {list_id} not found")

    # Step 2 — require layout
    if grocery_list.layout_id is None:
        raise ValueError(
            f"Grocery list {list_id} has no layout_id — cannot optimise route"
        )
    layout_id = grocery_list.layout_id

    # Step 3 — find ENTRY node for layout
    result = await db.execute(
        select(Node)
        .where(Node.layout_id == layout_id)
        .where(Node.node_type == NodeType.ENTRY)
        .limit(1)
    )
    entry_node = result.scalar_one_or_none()
    if entry_node is None:
        raise ValueError(
            f"Layout {layout_id} has no ENTRY node — cannot determine start position"
        )

    # Step 4 — collect product_ids (skip items without a product)
    items_with_product = [item for item in grocery_list.items if item.product_id is not None]
    product_ids: list[uuid.UUID] = [item.product_id for item in items_with_product]  # type: ignore[misc]

    if product_ids:
        # Step 5 — get optimised order
        ordered_product_ids = await navigation_service.optimize_list_order(
            db=db,
            layout_id=layout_id,
            start_node_id=entry_node.id,
            product_ids=product_ids,
        )

        # Step 6 — update sort_order per product-linked item
        product_position: dict[uuid.UUID, int] = {
            pid: idx for idx, pid in enumerate(ordered_product_ids)
        }

        # Items without product_id go after all routed items
        max_order = len(ordered_product_ids)
        tail_counter = max_order

        for item in grocery_list.items:
            if item.product_id is not None and item.product_id in product_position:
                await grocery_list_repository.update_item(
                    db, item, sort_order=product_position[item.product_id]
                )
            else:
                await grocery_list_repository.update_item(db, item, sort_order=tail_counter)
                tail_counter += 1

    # Step 7 — reload with fresh order
    refreshed = await grocery_list_repository.get_with_items(db, list_id)
    if refreshed is None:
        raise ValueError("Failed to reload grocery list after optimization")
    return refreshed
