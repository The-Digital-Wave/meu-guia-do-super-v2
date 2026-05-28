"""Layout Pydantic v2 schemas."""
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LayoutCreate(BaseModel):
    supermarket_id: uuid.UUID
    name: str
    width_m: float
    height_m: float
    image_url: str | None = None


class LayoutUpdate(BaseModel):
    name: str | None = None
    width_m: float | None = None
    height_m: float | None = None
    image_url: str | None = None


class LayoutOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    supermarket_id: uuid.UUID
    name: str
    width_m: float
    height_m: float
    image_url: str | None
    created_at: datetime
    updated_at: datetime | None
