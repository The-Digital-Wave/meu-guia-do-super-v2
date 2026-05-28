"""Shelf Pydantic v2 schemas."""
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ShelfCreate(BaseModel):
    layout_id: uuid.UUID
    node_id: uuid.UUID | None = None
    aisle: str
    section: str
    label: str | None = None
    x: float | None = None
    y: float | None = None
    width: float | None = None
    height: float | None = None
    color: str = "#1f6f5f"


class ShelfUpdate(BaseModel):
    node_id: uuid.UUID | None = None
    aisle: str | None = None
    section: str | None = None
    label: str | None = None
    x: float | None = None
    y: float | None = None
    width: float | None = None
    height: float | None = None
    color: str | None = None


class ShelfOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    layout_id: uuid.UUID
    node_id: uuid.UUID | None
    aisle: str
    section: str
    label: str | None
    x: float | None
    y: float | None
    width: float | None
    height: float | None
    color: str
    created_at: datetime
