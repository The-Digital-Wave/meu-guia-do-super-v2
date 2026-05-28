"""Product Pydantic v2 schemas."""
import uuid

from pydantic import BaseModel, ConfigDict


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    shelf_id: uuid.UUID | None
    name: str
    sku: str | None
    category: str | None
    brand: str | None
    image_url: str | None
    quantity: int
    section_index: int | None
