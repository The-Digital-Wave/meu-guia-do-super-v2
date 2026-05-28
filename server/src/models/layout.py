import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from src.models.edge import Edge
    from src.models.grocery_list import GroceryList
    from src.models.node import Node
    from src.models.shelf import Shelf
    from src.models.supermarket import Supermarket


class Layout(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "layouts"

    supermarket_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("supermarkets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    width_m: Mapped[float] = mapped_column(Float, nullable=False)
    height_m: Mapped[float] = mapped_column(Float, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String, nullable=True)

    # Relationships
    supermarket: Mapped["Supermarket"] = relationship("Supermarket", back_populates="layouts")
    nodes: Mapped[list["Node"]] = relationship(
        "Node",
        back_populates="layout",
        cascade="all, delete-orphan",
    )
    edges: Mapped[list["Edge"]] = relationship(
        "Edge",
        back_populates="layout",
        cascade="all, delete-orphan",
    )
    shelves: Mapped[list["Shelf"]] = relationship(
        "Shelf",
        back_populates="layout",
        cascade="all, delete-orphan",
    )
    grocery_lists: Mapped[list["GroceryList"]] = relationship(
        "GroceryList",
        back_populates="layout",
    )
