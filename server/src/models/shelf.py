import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from src.models.layout import Layout
    from src.models.node import Node
    from src.models.product import Product


class Shelf(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "shelves"

    layout_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("layouts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    node_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("nodes.id"),
        nullable=True,
        index=True,
    )
    aisle: Mapped[str] = mapped_column(String, nullable=False)
    section: Mapped[str] = mapped_column(String, nullable=False)
    label: Mapped[str | None] = mapped_column(String, nullable=True)
    x: Mapped[float | None] = mapped_column(Float, nullable=True)
    y: Mapped[float | None] = mapped_column(Float, nullable=True)
    width: Mapped[float | None] = mapped_column(Float, nullable=True)
    height: Mapped[float | None] = mapped_column(Float, nullable=True)
    color: Mapped[str] = mapped_column(String, default="#1f6f5f", nullable=False)

    # Relationships
    layout: Mapped["Layout"] = relationship("Layout", back_populates="shelves")
    node: Mapped["Node | None"] = relationship("Node", back_populates="shelves")
    products: Mapped[list["Product"]] = relationship(
        "Product",
        back_populates="shelf",
    )
