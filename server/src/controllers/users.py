"""Users controller stub — full implementation in Task 2."""
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.user import User
from src.repositories import user_repository
from src.schemas.auth import UserOut
from src.schemas.user import UserUpdate


async def get_me(current_user: User) -> UserOut:
    """Return the current authenticated user's profile."""
    return UserOut.model_validate(current_user)


async def update_me(payload: UserUpdate, current_user: User, db: AsyncSession) -> UserOut:
    """Update allowed fields on the current user's profile."""
    updates: dict[str, object] = {}
    if payload.full_name is not None:
        updates["full_name"] = payload.full_name
    if payload.email is not None:
        updates["email"] = payload.email

    if not updates:
        return UserOut.model_validate(current_user)

    try:
        user = await user_repository.update(db, current_user, **updates)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Update failed — email may already be in use",
        )
    return UserOut.model_validate(user)
