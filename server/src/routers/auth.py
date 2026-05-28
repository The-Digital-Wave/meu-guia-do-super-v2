"""Auth router — POST /auth/register|login|refresh|logout."""
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers import auth as auth_controller
from src.database import get_db
from src.models.user import User
from src.schemas.auth import LoginResponse, RefreshRequest, RegisterRequest, TokenResponse
from src.schemas.common import MessageResponse
from src.utils.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=LoginResponse, status_code=201)
async def register(
    payload: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LoginResponse:
    """Register a new user account."""
    return await auth_controller.register(payload, db)


@router.post("/login", response_model=LoginResponse)
async def login(
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LoginResponse:
    """Authenticate with email (username field) and password."""
    return await auth_controller.login(form, db)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    payload: RefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Exchange a valid refresh token for a new access token."""
    return await auth_controller.refresh_token(payload, db)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    _current_user: Annotated[User, Depends(get_current_user)],
) -> MessageResponse:
    """Invalidate the current session (stateless MVP — token not blacklisted)."""
    return auth_controller.logout()
