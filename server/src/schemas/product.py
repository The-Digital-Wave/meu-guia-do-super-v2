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
    description: str | None
    image_url: str | None
    quantity: int
    section_index: int | None


class ProductPage(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    size: int


class ProductCreate(BaseModel):
    shelf_id: uuid.UUID | None = None
    name: str
    sku: str | None = None
    category: str | None = None
    brand: str | None = None
    description: str | None = None
    image_url: str | None = None
    quantity: int = 0
    section_index: int | None = None


class ProductUpdate(BaseModel):
    shelf_id: uuid.UUID | None = None
    name: str | None = None
    sku: str | None = None
    category: str | None = None
    brand: str | None = None
    description: str | None = None
    image_url: str | None = None
    quantity: int | None = None
    section_index: int | None = None
