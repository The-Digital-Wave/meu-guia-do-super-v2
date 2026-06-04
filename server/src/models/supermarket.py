"""Supermarket SQLAlchemy model."""
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from src.models.layout import Layout


class Supermarket(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "supermarkets"

    name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    logo_url: Mapped[str | None] = mapped_column(String, nullable=True)
    address: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    layouts: Mapped[list["Layout"]] = relationship(
        "Layout",
        back_populates="supermarket",
        cascade="all, delete-orphan",
    )
