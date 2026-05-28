"""Users controller — input extraction and validation only."""
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.user import User
from src.schemas.auth import UserOut
from src.schemas.user import UserUpdate
from src.services import user_service


async def get_me(current_user: User) -> UserOut:
    """Return the current authenticated user's profile."""
    return UserOut.model_validate(current_user)


async def update_me(payload: UserUpdate, current_user: User, db: AsyncSession) -> UserOut:
    """Update allowed fields on the current user's profile."""
    try:
        user = await user_service.update_me(
            db=db,
            user=current_user,
            full_name=payload.full_name,
            email=payload.email,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Update failed — email may already be in use",
        )
    return UserOut.model_validate(user)
