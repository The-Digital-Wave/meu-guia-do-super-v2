"""Product repository — SQLAlchemy async data access only. No business logic here."""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.product import Product


async def get_all(
    db: AsyncSession,
    q: str | None = None,
    category: str | None = None,
    shelf_id: uuid.UUID | None = None,
) -> list[Product]:
    """Return all products, with optional filters.

    q: case-insensitive ILIKE filter on name or brand.
    category: exact match filter.
    shelf_id: filter by shelf.
    """
    stmt = select(Product)
    if q is not None:
        escaped = q.replace("\\", "\\\\").replace("%", r"\%").replace("_", r"\_")
        pattern = f"%{escaped}%"
        stmt = stmt.where(
            Product.name.ilike(pattern, escape="\\") | Product.brand.ilike(pattern, escape="\\")  # type: ignore[operator]
        )
    if category is not None:
        stmt = stmt.where(Product.category == category)
    if shelf_id is not None:
        stmt = stmt.where(Product.shelf_id == shelf_id)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, product_id: uuid.UUID) -> Product | None:
    """Return the Product with the given id, or None."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    return result.scalar_one_or_none()


async def get_by_section(db: AsyncSession, section_id: uuid.UUID) -> list[Product]:
    """Return all products whose shelf_id matches section_id."""
    result = await db.execute(select(Product).where(Product.shelf_id == section_id))
    return list(result.scalars().all())


async def create(db: AsyncSession, **fields: object) -> Product:
    """Insert and return a new Product row."""
    product = Product(**fields)
    db.add(product)
    await db.flush()
    await db.refresh(product)
    return product


async def update(db: AsyncSession, product: Product, **fields: object) -> Product:
    """Apply keyword-argument field updates to the product and flush."""
    for key, value in fields.items():
        setattr(product, key, value)
    await db.flush()
    await db.refresh(product)
    return product


async def delete(db: AsyncSession, product: Product) -> None:
    """Delete the given product row."""
    await db.delete(product)
    await db.flush()
