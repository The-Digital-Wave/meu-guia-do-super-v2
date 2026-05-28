"""User service — business logic for user profile operations."""
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.user import User
from src.repositories import user_repository


async def get_me(db: AsyncSession, user: User) -> User:
    """Return the current authenticated user's profile.

    The user is already loaded by the get_current_user dependency,
    so we simply return it.
    """
    return user


async def update_me(
    db: AsyncSession,
    user: User,
    full_name: str | None = None,
    email: str | None = None,
) -> User:
    """Update allowed fields on the current user's profile.

    Args:
        db: AsyncSession for database operations.
        user: The current User object to update.
        full_name: New full name (optional).
        email: New email (optional).

    Returns:
        The updated User object.
    """
    updates: dict[str, object] = {}
    if full_name is not None:
        updates["full_name"] = full_name
    if email is not None:
        updates["email"] = email

    if not updates:
        return user

    # Delegate to repository for data access
    user = await user_repository.update(db, user, **updates)
    return user
