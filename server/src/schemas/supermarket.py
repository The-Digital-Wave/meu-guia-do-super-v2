"""Supermarket Pydantic v2 schemas."""
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from src.schemas.layout import LayoutOut


class SupermarketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    logo_url: str | None
    address: str | None
    is_active: bool
    created_at: datetime


class SupermarketDetailOut(SupermarketOut):
    layouts: list[LayoutOut] = []
