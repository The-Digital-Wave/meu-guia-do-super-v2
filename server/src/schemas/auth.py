"""Auth-related Pydantic v2 schemas."""
import uuid
from datetime import datetime

from pydantic import BaseModel

from src.models.user import UserRole


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str | None = None


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str | None
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
