"""Auth controller — extracts validated input, delegates to auth_service, maps errors."""
from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.auth import LoginResponse, RefreshRequest, RegisterRequest, TokenResponse, UserOut
from src.schemas.common import MessageResponse
from src.services import auth_service


async def register(payload: RegisterRequest, db: AsyncSession) -> LoginResponse:
    """Register a new user; raise 400 if email is already taken."""
    try:
        user, access_token, refresh_token = await auth_service.register(
            db,
            email=payload.email,
            password=payload.password,
            full_name=payload.full_name,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserOut.model_validate(user),
    )


async def login(form: OAuth2PasswordRequestForm, db: AsyncSession) -> LoginResponse:
    """Authenticate via OAuth2 form; raise 401 on invalid credentials."""
    try:
        user, access_token, refresh_token = await auth_service.login(
            db,
            email=form.username,
            password=form.password,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserOut.model_validate(user),
    )


async def refresh_token(payload: RefreshRequest, db: AsyncSession) -> TokenResponse:
    """Reissue an access token from a valid refresh token; raise 401 on failure."""
    try:
        access_token = await auth_service.refresh(db, payload.refresh_token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    return TokenResponse(access_token=access_token)


def logout() -> MessageResponse:
    """Logout — MVP: stateless, just acknowledge the request."""
    return MessageResponse(message="Logged out successfully")
