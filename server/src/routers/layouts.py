"""Layouts router — full CRUD + shelves/download/nodes/edges sub-resources."""
import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers import layout as layout_controller
from src.database import get_db
from src.models.user import User
from src.schemas.edge import EdgeCreate, EdgeOut
from src.schemas.layout import LayoutCreate, LayoutOut, LayoutUpdate
from src.schemas.node import NodeCreate, NodeOut
from src.schemas.shelf import ShelfOut
from src.utils.auth import require_admin

router = APIRouter(prefix="/layouts", tags=["layouts"])


@router.get("", response_model=list[LayoutOut], status_code=status.HTTP_200_OK)
async def list_layouts(
    db: Annotated[AsyncSession, Depends(get_db)],
    supermarket_id: uuid.UUID | None = None,
) -> list[LayoutOut]:
    """List all layouts, optionally filtered by supermarket_id."""
    layouts = await layout_controller.list_layouts(db, supermarket_id=supermarket_id)
    return [LayoutOut.model_validate(layout) for layout in layouts]


@router.get("/{layout_id}", response_model=LayoutOut, status_code=status.HTTP_200_OK)
async def get_layout(
    layout_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LayoutOut:
    """Get a layout by id."""
    layout = await layout_controller.get_layout(db, layout_id)
    return LayoutOut.model_validate(layout)


@router.post("", response_model=LayoutOut, status_code=status.HTTP_201_CREATED)
async def create_layout(
    payload: LayoutCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_admin)],
) -> LayoutOut:
    """Create a new layout. Admin only."""
    layout = await layout_controller.create_layout(payload, db)
    return LayoutOut.model_validate(layout)


@router.put("/{layout_id}", response_model=LayoutOut, status_code=status.HTTP_200_OK)
async def update_layout(
    layout_id: uuid.UUID,
    payload: LayoutUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_admin)],
) -> LayoutOut:
    """Update a layout. Admin only."""
    layout = await layout_controller.update_layout(layout_id, payload, db)
    return LayoutOut.model_validate(layout)


@router.delete("/{layout_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_layout(
    layout_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_admin)],
) -> Response:
    """Delete a layout. Admin only."""
    await layout_controller.delete_layout(layout_id, db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/{layout_id}/shelves",
    response_model=list[ShelfOut],
    status_code=status.HTTP_200_OK,
)
async def get_layout_shelves(
    layout_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[ShelfOut]:
    """Get all shelves for a layout."""
    shelves = await layout_controller.get_layout_shelves(db, layout_id)
    return [ShelfOut.model_validate(s) for s in shelves]


@router.get(
    "/{layout_id}/download",
    status_code=status.HTTP_200_OK,
)
async def download_layout(
    layout_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """Download the full offline bundle for a layout."""
    return await layout_controller.download_layout(db, layout_id)


@router.get(
    "/{layout_id}/nodes",
    response_model=list[NodeOut],
    status_code=status.HTTP_200_OK,
)
async def list_layout_nodes(
    layout_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[NodeOut]:
    """List all nodes for a layout."""
    nodes = await layout_controller.list_layout_nodes(db, layout_id)
    return [NodeOut.model_validate(n) for n in nodes]


@router.post(
    "/{layout_id}/nodes",
    response_model=NodeOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_layout_node(
    layout_id: uuid.UUID,
    payload: NodeCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_admin)],
) -> NodeOut:
    """Create a new node in a layout. Admin only."""
    node = await layout_controller.create_layout_node(layout_id, payload, db)
    return NodeOut.model_validate(node)


@router.get(
    "/{layout_id}/edges",
    response_model=list[EdgeOut],
    status_code=status.HTTP_200_OK,
)
async def list_layout_edges(
    layout_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[EdgeOut]:
    """List all edges for a layout."""
    edges = await layout_controller.list_layout_edges(db, layout_id)
    return [EdgeOut.model_validate(e) for e in edges]


@router.post(
    "/{layout_id}/edges",
    response_model=EdgeOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_layout_edge(
    layout_id: uuid.UUID,
    payload: EdgeCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(require_admin)],
) -> EdgeOut:
    """Create a new edge in a layout. Admin only."""
    edge = await layout_controller.create_layout_edge(layout_id, payload, db)
    return EdgeOut.model_validate(edge)
