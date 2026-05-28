"""Auth service — business logic for registration, login, and token refresh."""
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.user import User, UserRole
from src.repositories import user_repository
from src.utils.auth import create_access_token, create_refresh_token, decode_refresh_token

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _hash_password(password: str) -> str:
    return _pwd_context.hash(password)


def _verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


async def register(
    db: AsyncSession,
    email: str,
    password: str,
    full_name: str | None,
) -> tuple[User, str, str]:
    """Register a new user.

    Raises ValueError("Email already registered") if the email is taken.
    Returns (user, access_token, refresh_token).
    """
    existing = await user_repository.get_by_email(db, email)
    if existing is not None:
        raise ValueError("Email already registered")

    password_hash = _hash_password(password)
    user = await user_repository.create(
        db,
        email=email,
        password_hash=password_hash,
        full_name=full_name,
        role=UserRole.CUSTOMER,
    )

    token_data = {"sub": str(user.id)}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    return user, access_token, refresh_token


async def login(
    db: AsyncSession,
    email: str,
    password: str,
) -> tuple[User, str, str]:
    """Authenticate an existing user.

    Raises ValueError("Invalid credentials") if the user is not found, is inactive,
    or the password does not match.
    Returns (user, access_token, refresh_token).
    """
    user = await user_repository.get_by_email(db, email)
    if user is None or not user.is_active or not _verify_password(password, user.password_hash):
        raise ValueError("Invalid credentials")

    token_data = {"sub": str(user.id)}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    return user, access_token, refresh_token


async def refresh(db: AsyncSession, refresh_token_str: str) -> str:
    """Decode a refresh token and issue a new access token.

    Raises ValueError("Invalid or expired refresh token") on decode failure.
    Returns the new access_token string.
    """
    try:
        payload = decode_refresh_token(refresh_token_str)
    except Exception:
        raise ValueError("Invalid or expired refresh token")

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise ValueError("Invalid or expired refresh token")

    user = await user_repository.get_by_id(db, user_id)
    if user is None or not user.is_active:
        raise ValueError("Invalid or expired refresh token")

    return create_access_token({"sub": str(user.id)})
