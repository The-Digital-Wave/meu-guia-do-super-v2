import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from src.models.layout import Layout
    from src.models.product import Product
    from src.models.user import User


class GroceryList(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "grocery_lists"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    layout_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("layouts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String, default="Minha Lista", nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="grocery_lists")
    layout: Mapped["Layout | None"] = relationship("Layout", back_populates="grocery_lists")
    items: Mapped[list["GroceryListItem"]] = relationship(
        "GroceryListItem",
        back_populates="grocery_list",
        cascade="all, delete-orphan",
    )


class GroceryListItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "grocery_list_items"

    list_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("grocery_lists.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    product_name_snapshot: Mapped[str] = mapped_column(String, nullable=False)
    checked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    grocery_list: Mapped["GroceryList"] = relationship("GroceryList", back_populates="items")
    product: Mapped["Product | None"] = relationship(
        "Product",
        back_populates="grocery_list_items",
    )
