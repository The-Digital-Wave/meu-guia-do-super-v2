"""Products router — full CRUD + search."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers import product as product_controller
from src.database import get_db
from src.models.user import User
from src.schemas.product import ProductCreate, ProductOut, ProductUpdate
from src.utils.auth import require_admin

router = APIRouter(prefix="/products", tags=["products"])


# NOTE: /products/section/{section_id} MUST be defined before /products/{id}
# to prevent FastAPI from treating "section" as a UUID parameter.
@router.get(
    "/section/{section_id}",
    response_model=list[ProductOut],
    status_code=status.HTTP_200_OK,
)
async def list_products_by_section(
    section_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[ProductOut]:
    """List all products in a section (by shelf id). Public."""
    products = await product_controller.get_products_by_section(db, section_id)
    return [ProductOut.model_validate(p) for p in products]


@router.get("", response_model=list[ProductOut], status_code=status.HTTP_200_OK)
async def list_products(
    db: Annotated[AsyncSession, Depends(get_db)],
    q: Annotated[
        str | None, Query(description="Search by name or brand (case-insensitive)")
    ] = None,
    category: Annotated[str | None, Query(description="Filter by exact category")] = None,
    shelf_id: Annotated[uuid.UUID | None, Query(description="Filter by shelf id")] = None,
) -> list[ProductOut]:
    """List all products with optional search/filter. Public."""
    products = await product_controller.list_products(db, q=q, category=category, shelf_id=shelf_id)
    return [ProductOut.model_validate(p) for p in products]


@router.get("/{product_id}", response_model=ProductOut, status_code=status.HTTP_200_OK)
async def get_product(
    product_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProductOut:
    """Get a product by id. Public."""
    product = await product_controller.get_product(db, product_id)
    return ProductOut.model_validate(product)


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_admin)],
) -> ProductOut:
    """Create a new product. Admin only."""
    product = await product_controller.create_product(payload, db)
    return ProductOut.model_validate(product)


@router.put("/{product_id}", response_model=ProductOut, status_code=status.HTTP_200_OK)
async def update_product(
    product_id: uuid.UUID,
    payload: ProductUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_admin)],
) -> ProductOut:
    """Update a product. Admin only."""
    product = await product_controller.update_product(product_id, payload, db)
    return ProductOut.model_validate(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_admin)],
) -> Response:
    """Delete a product. Admin only."""
    await product_controller.delete_product(product_id, db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
