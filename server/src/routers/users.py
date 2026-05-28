"""Users router — GET /users/me and PUT /users/me."""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers import users as users_controller
from src.database import get_db
from src.models.user import User
from src.schemas.auth import UserOut
from src.schemas.user import UserUpdate
from src.utils.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserOut:
    """Return the current authenticated user's profile."""
    return await users_controller.get_me(current_user)


@router.put("/me", response_model=UserOut)
async def update_me(
    payload: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserOut:
    """Update the current user's full_name and/or email."""
    return await users_controller.update_me(payload, current_user, db)
