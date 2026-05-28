"""Node Pydantic v2 schemas."""
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from src.models.node import NodeType


class NodeCreate(BaseModel):
    x: float
    y: float
    node_type: NodeType
    label: str | None = None


class NodeUpdate(BaseModel):
    x: float | None = None
    y: float | None = None
    node_type: NodeType | None = None
    label: str | None = None


class NodeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    layout_id: uuid.UUID
    x: float
    y: float
    node_type: NodeType
    label: str | None
    created_at: datetime
