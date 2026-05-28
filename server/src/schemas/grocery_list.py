"""Grocery list Pydantic v2 schemas."""
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class GroceryListCreate(BaseModel):
    layout_id: uuid.UUID | None = None
    name: str = "Minha Lista"


class GroceryListOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    layout_id: uuid.UUID | None
    name: str
    created_at: datetime


class GroceryListItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    list_id: uuid.UUID
    product_id: uuid.UUID | None
    product_name_snapshot: str
    checked: bool
    sort_order: int
    created_at: datetime


class GroceryListWithItemsOut(GroceryListOut):
    items: list[GroceryListItemOut] = []


class GroceryListItemCreate(BaseModel):
    product_id: uuid.UUID | None = None
    product_name_snapshot: str


class GroceryListItemUpdate(BaseModel):
    checked: bool | None = None
    sort_order: int | None = None
