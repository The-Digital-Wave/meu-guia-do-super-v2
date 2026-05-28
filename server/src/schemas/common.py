"""Shared Pydantic schemas: error responses, pagination helpers."""
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    detail: str


class MessageResponse(BaseModel):
    message: str
