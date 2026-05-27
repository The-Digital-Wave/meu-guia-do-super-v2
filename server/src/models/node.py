import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum
from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from src.models.edge import Edge
    from src.models.layout import Layout
    from src.models.shelf import Shelf

import enum


class NodeType(enum.StrEnum):
    INTERSECTION = "INTERSECTION"
    SHELF_FRONT = "SHELF_FRONT"
    ENTRY = "ENTRY"
    EXIT = "EXIT"


class Node(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "nodes"

    layout_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("layouts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    x: Mapped[float] = mapped_column(Float, nullable=False)
    y: Mapped[float] = mapped_column(Float, nullable=False)
    node_type: Mapped[NodeType] = mapped_column(
        SAEnum(NodeType, name="node_type_enum"),
        nullable=False,
    )
    label: Mapped[str | None] = mapped_column(String, nullable=True)

    # Relationships
    layout: Mapped["Layout"] = relationship("Layout", back_populates="nodes")
    shelves: Mapped[list["Shelf"]] = relationship("Shelf", back_populates="node")
    edges_from: Mapped[list["Edge"]] = relationship(
        "Edge",
        foreign_keys="[Edge.node_from_id]",
        back_populates="node_from",
    )
    edges_to: Mapped[list["Edge"]] = relationship(
        "Edge",
        foreign_keys="[Edge.node_to_id]",
        back_populates="node_to",
    )
