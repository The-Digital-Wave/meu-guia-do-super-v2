"""User profile Pydantic v2 schemas."""
from pydantic import BaseModel, EmailStr

from src.schemas.auth import UserOut


class UserUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None


__all__ = ["UserOut", "UserUpdate"]
