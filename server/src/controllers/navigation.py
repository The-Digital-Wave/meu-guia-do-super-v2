"""Navigation controller — input extraction, delegates to navigation_service, maps errors."""
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.navigation import RouteRequest, RouteResponse
from src.services import navigation_service


async def calculate_route(
    payload: RouteRequest,
    db: AsyncSession,
) -> RouteResponse:
    """Validate inputs, delegate to service, map ValueError → HTTP errors."""
    try:
        result = await navigation_service.calculate_route(
            db=db,
            layout_id=payload.layout_id,
            start_node_id=payload.start_node_id,
            product_ids=payload.product_ids,
        )
    except ValueError as exc:
        msg = str(exc)
        # Distinguish not-found (layout/node/product/shelf) from routing errors
        if "not found" in msg.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=msg)
        raise HTTPException(status_code=422, detail=msg)

    return RouteResponse(**result)


async def optimize_grocery_list(
    db: AsyncSession,
    layout_id: uuid.UUID,
    start_node_id: uuid.UUID,
    product_ids: list[uuid.UUID],
) -> list[uuid.UUID]:
    """Delegate grocery-list TSP ordering to navigation service."""
    try:
        return await navigation_service.optimize_list_order(
            db=db,
            layout_id=layout_id,
            start_node_id=start_node_id,
            product_ids=product_ids,
        )
    except ValueError as exc:
        msg = str(exc)
        if "not found" in msg.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=msg)
        raise HTTPException(status_code=422, detail=msg)
