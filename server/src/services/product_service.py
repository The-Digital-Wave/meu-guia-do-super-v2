"""Product service — business logic only. No direct DB queries; calls repository."""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.models.product import Product
from src.repositories import product_repository
from src.schemas.product import ProductCreate, ProductUpdate


async def list_products(
    db: AsyncSession,
    q: str | None = None,
    category: str | None = None,
    shelf_id: uuid.UUID | None = None,
) -> list[Product]:
    """Return all products, with optional search/filter parameters."""
    return await product_repository.get_all(db, q=q, category=category, shelf_id=shelf_id)


async def get_product(db: AsyncSession, product_id: uuid.UUID) -> Product:
    """Return the product by id.

    Raises ValueError if not found.
    """
    product = await product_repository.get_by_id(db, product_id)
    if product is None:
        raise ValueError(f"Product {product_id} not found")
    return product


async def get_products_by_section(db: AsyncSession, section_id: uuid.UUID) -> list[Product]:
    """Return all products for the given section (mapped to shelf_id)."""
    return await product_repository.get_by_section(db, section_id)


async def create_product(db: AsyncSession, data: ProductCreate) -> Product:
    """Create a new product from validated input data."""
    return await product_repository.create(
        db,
        shelf_id=data.shelf_id,
        name=data.name,
        sku=data.sku,
        category=data.category,
        brand=data.brand,
        description=data.description,
        image_url=data.image_url,
        quantity=data.quantity,
        section_index=data.section_index,
    )


async def update_product(
    db: AsyncSession, product_id: uuid.UUID, data: ProductUpdate
) -> Product:
    """Update an existing product.

    Raises ValueError if not found.
    """
    product = await product_repository.get_by_id(db, product_id)
    if product is None:
        raise ValueError(f"Product {product_id} not found")
    updates = data.model_dump(exclude_unset=True)
    return await product_repository.update(db, product, **updates)


async def delete_product(db: AsyncSession, product_id: uuid.UUID) -> None:
    """Delete a product by id.

    Raises ValueError if not found.
    """
    product = await product_repository.get_by_id(db, product_id)
    if product is None:
        raise ValueError(f"Product {product_id} not found")
    await product_repository.delete(db, product)
