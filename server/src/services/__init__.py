"""Service layer — business logic only. No direct SQLAlchemy queries."""
from src.services import user_service

__all__ = ["user_service"]
