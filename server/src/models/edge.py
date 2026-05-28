import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from src.models.layout import Layout
    from src.models.node import Node


class Edge(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "edges"

    layout_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("layouts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    node_from_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("nodes.id"),
        nullable=False,
        index=True,
    )
    node_to_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("nodes.id"),
        nullable=False,
        index=True,
    )
    distance_m: Mapped[float] = mapped_column(Float, nullable=False)
    bidirectional: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    layout: Mapped["Layout"] = relationship("Layout", back_populates="edges")
    node_from: Mapped["Node"] = relationship(
        "Node",
        foreign_keys=[node_from_id],
        back_populates="edges_from",
    )
    node_to: Mapped["Node"] = relationship(
        "Node",
        foreign_keys=[node_to_id],
        back_populates="edges_to",
    )
