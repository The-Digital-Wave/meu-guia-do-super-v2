"""Layout controller — extracts validated input, delegates to layout_service, maps errors."""
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.layout import Layout
from src.schemas.edge import EdgeCreate, EdgeOut
from src.schemas.layout import LayoutCreate, LayoutOut, LayoutUpdate
from src.schemas.node import NodeCreate, NodeOut
from src.schemas.product import ProductOut
from src.schemas.shelf import ShelfOut
from src.services import edge_service, layout_service, node_service


async def list_layouts(db: AsyncSession) -> list[Layout]:
    return await layout_service.list_layouts(db)


async def get_layout(db: AsyncSession, layout_id: uuid.UUID) -> Layout:
    try:
        return await layout_service.get_layout(db, layout_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


async def create_layout(data: LayoutCreate, db: AsyncSession) -> Layout:
    return await layout_service.create_layout(db, data)


async def update_layout(layout_id: uuid.UUID, data: LayoutUpdate, db: AsyncSession) -> Layout:
    try:
        return await layout_service.update_layout(db, layout_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


async def delete_layout(layout_id: uuid.UUID, db: AsyncSession) -> None:
    try:
        await layout_service.delete_layout(db, layout_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


async def get_layout_shelves(db: AsyncSession, layout_id: uuid.UUID) -> list:
    try:
        result = await layout_service.get_layout_with_shelves(db, layout_id)
        return result["shelves"]
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


async def download_layout(db: AsyncSession, layout_id: uuid.UUID) -> dict:
    try:
        bundle = await layout_service.download_layout(db, layout_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    layout = bundle["layout"]
    return {
        "layout": LayoutOut.model_validate(layout).model_dump(),
        "nodes": [NodeOut.model_validate(n).model_dump() for n in bundle["nodes"]],
        "edges": [EdgeOut.model_validate(e).model_dump() for e in bundle["edges"]],
        "shelves": [ShelfOut.model_validate(s).model_dump() for s in bundle["shelves"]],
        "products": [ProductOut.model_validate(p).model_dump() for p in bundle["products"]],
    }


async def list_layout_nodes(db: AsyncSession, layout_id: uuid.UUID) -> list:
    try:
        return await node_service.list_nodes_for_layout(db, layout_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


async def create_layout_node(
    layout_id: uuid.UUID, data: NodeCreate, db: AsyncSession
) -> object:
    try:
        return await node_service.create_node(db, layout_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


async def list_layout_edges(db: AsyncSession, layout_id: uuid.UUID) -> list:
    try:
        return await edge_service.list_edges_for_layout(db, layout_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


async def create_layout_edge(
    layout_id: uuid.UUID, data: EdgeCreate, db: AsyncSession
) -> object:
    try:
        return await edge_service.create_edge(db, layout_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
