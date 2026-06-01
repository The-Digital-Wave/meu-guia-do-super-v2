"""Navigation router — wayfinding route calculation endpoint."""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers import navigation as navigation_controller
from src.database import get_db
from src.schemas.navigation import RouteRequest, RouteResponse

router = APIRouter(prefix="/navigation", tags=["navigation"])


@router.post("/route", response_model=RouteResponse, status_code=200)
async def calculate_route(
    payload: RouteRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RouteResponse:
    """Calculate an optimised in-store route for the given product list.

    Public endpoint — no authentication required (spec §9).
    Returns turn-by-turn path segments with distance and estimated walking time.
    """
    return await navigation_controller.calculate_route(payload, db)
