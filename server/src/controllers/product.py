"""Product controller — extracts validated input, delegates to product_service, maps errors."""
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.product import Product
from src.schemas.product import ProductCreate, ProductUpdate
from src.services import product_service


async def list_products(
    db: AsyncSession,
    q: str | None = None,
    category: str | None = None,
    shelf_id: uuid.UUID | None = None,
) -> list[Product]:
    return await product_service.list_products(db, q=q, category=category, shelf_id=shelf_id)


async def get_product(db: AsyncSession, product_id: uuid.UUID) -> Product:
    try:
        return await product_service.get_product(db, product_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


async def get_products_by_section(db: AsyncSession, section_id: uuid.UUID) -> list[Product]:
    return await product_service.get_products_by_section(db, section_id)


async def create_product(data: ProductCreate, db: AsyncSession) -> Product:
    return await product_service.create_product(db, data)


async def update_product(
    product_id: uuid.UUID, data: ProductUpdate, db: AsyncSession
) -> Product:
    try:
        return await product_service.update_product(db, product_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


async def delete_product(product_id: uuid.UUID, db: AsyncSession) -> None:
    try:
        await product_service.delete_product(db, product_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
