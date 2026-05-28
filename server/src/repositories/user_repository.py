"""User repository — SQLAlchemy data access only. No business logic here."""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.user import User, UserRole


async def get_by_email(db: AsyncSession, email: str) -> User | None:
    """Return the User with the given email, or None."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_by_id(db: AsyncSession, user_id: str | uuid.UUID) -> User | None:
    """Return the User with the given id, or None."""
    uid = uuid.UUID(str(user_id)) if not isinstance(user_id, uuid.UUID) else user_id
    result = await db.execute(select(User).where(User.id == uid))
    return result.scalar_one_or_none()


async def create(
    db: AsyncSession,
    email: str,
    password_hash: str,
    full_name: str | None,
    role: UserRole = UserRole.CUSTOMER,
) -> User:
    """Insert and return a new User row."""
    user = User(
        email=email,
        password_hash=password_hash,
        full_name=full_name,
        role=role,
    )
    db.add(user)
    await db.flush()  # populate id without committing; get_db() commits on exit
    await db.refresh(user)
    return user


async def update(db: AsyncSession, user: User, **fields: object) -> User:
    """Apply keyword-argument field updates to the user and flush."""
    for key, value in fields.items():
        setattr(user, key, value)
    await db.flush()
    await db.refresh(user)
    return user
