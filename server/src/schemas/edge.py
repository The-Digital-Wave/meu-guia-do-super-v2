"""Edge Pydantic v2 schemas."""
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EdgeCreate(BaseModel):
    node_from_id: uuid.UUID
    node_to_id: uuid.UUID
    distance_m: float
    bidirectional: bool = True


class EdgeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    layout_id: uuid.UUID
    node_from_id: uuid.UUID
    node_to_id: uuid.UUID
    distance_m: float
    bidirectional: bool
    created_at: datetime
