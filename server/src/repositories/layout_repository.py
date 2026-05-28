"""Layout repository — SQLAlchemy async data access only. No business logic here."""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.edge import Edge
from src.models.layout import Layout
from src.models.node import Node
from src.models.product import Product
from src.models.shelf import Shelf


async def get_all(db: AsyncSession) -> list[Layout]:
    """Return all layouts."""
    result = await db.execute(select(Layout))
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, layout_id: uuid.UUID) -> Layout | None:
    """Return the Layout with the given id, or None."""
    result = await db.execute(select(Layout).where(Layout.id == layout_id))
    return result.scalar_one_or_none()


async def get_by_supermarket(db: AsyncSession, supermarket_id: uuid.UUID) -> list[Layout]:
    """Return all layouts for the given supermarket."""
    result = await db.execute(
        select(Layout).where(Layout.supermarket_id == supermarket_id)
    )
    return list(result.scalars().all())


async def create(db: AsyncSession, **fields: object) -> Layout:
    """Insert and return a new Layout row."""
    layout = Layout(**fields)
    db.add(layout)
    await db.flush()
    await db.refresh(layout)
    return layout


async def update(db: AsyncSession, layout: Layout, **fields: object) -> Layout:
    """Apply keyword-argument field updates to the layout and flush."""
    for key, value in fields.items():
        setattr(layout, key, value)
    await db.flush()
    await db.refresh(layout)
    return layout


async def delete(db: AsyncSession, layout: Layout) -> None:
    """Delete the given layout row."""
    await db.delete(layout)
    await db.flush()


async def get_with_shelves(db: AsyncSession, layout_id: uuid.UUID) -> Layout | None:
    """Return the Layout with eagerly loaded shelves, or None."""
    result = await db.execute(
        select(Layout)
        .options(selectinload(Layout.shelves))
        .where(Layout.id == layout_id)
    )
    return result.scalar_one_or_none()


async def get_with_nodes(db: AsyncSession, layout_id: uuid.UUID) -> Layout | None:
    """Return the Layout with eagerly loaded nodes, or None."""
    result = await db.execute(
        select(Layout)
        .options(selectinload(Layout.nodes))
        .where(Layout.id == layout_id)
    )
    return result.scalar_one_or_none()


async def get_with_edges(db: AsyncSession, layout_id: uuid.UUID) -> Layout | None:
    """Return the Layout with eagerly loaded edges, or None."""
    result = await db.execute(
        select(Layout)
        .options(selectinload(Layout.edges))
        .where(Layout.id == layout_id)
    )
    return result.scalar_one_or_none()


async def get_full_bundle(db: AsyncSession, layout_id: uuid.UUID) -> dict | None:
    """Return the full offline bundle for a layout: layout + nodes + edges + shelves + products."""
    # Fetch layout
    result = await db.execute(select(Layout).where(Layout.id == layout_id))
    layout = result.scalar_one_or_none()
    if layout is None:
        return None

    # Fetch nodes
    nodes_result = await db.execute(select(Node).where(Node.layout_id == layout_id))
    nodes = list(nodes_result.scalars().all())

    # Fetch edges
    edges_result = await db.execute(select(Edge).where(Edge.layout_id == layout_id))
    edges = list(edges_result.scalars().all())

    # Fetch shelves
    shelves_result = await db.execute(select(Shelf).where(Shelf.layout_id == layout_id))
    shelves = list(shelves_result.scalars().all())

    # Fetch products for all shelves in this layout
    shelf_ids = [s.id for s in shelves]
    products: list[Product] = []
    if shelf_ids:
        products_result = await db.execute(
            select(Product).where(Product.shelf_id.in_(shelf_ids))
        )
        products = list(products_result.scalars().all())

    return {
        "layout": layout,
        "nodes": nodes,
        "edges": edges,
        "shelves": shelves,
        "products": products,
    }
