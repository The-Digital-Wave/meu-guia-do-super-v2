"""Navigation router — wayfinding route calculation endpoint."""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers import navigation as navigation_controller
from src.database import get_db
from src.models.user import User
from src.schemas.navigation import RouteRequest, RouteResponse
from src.utils.auth import get_current_user

router = APIRouter(prefix="/navigation", tags=["navigation"])


@router.post("/route", response_model=RouteResponse, status_code=200)
async def calculate_route(
    payload: RouteRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> RouteResponse:
    """Calculate an optimised in-store route for the given product list.

    Requires authentication. Returns turn-by-turn path segments with
    distance and estimated walking time per segment.
    """
    return await navigation_controller.calculate_route(payload, db)
