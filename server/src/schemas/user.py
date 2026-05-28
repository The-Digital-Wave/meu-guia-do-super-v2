"""User profile Pydantic v2 schemas."""
from pydantic import BaseModel

from src.schemas.auth import UserOut


class UserUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None


__all__ = ["UserOut", "UserUpdate"]
