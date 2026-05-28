"""Navigation Pydantic v2 schemas — route request and response."""
import uuid

from pydantic import BaseModel, ConfigDict, field_validator


class RouteRequest(BaseModel):
    layout_id: uuid.UUID
    start_node_id: uuid.UUID
    product_ids: list[uuid.UUID]

    @field_validator("product_ids")
    @classmethod
    def at_least_one(cls, v: list[uuid.UUID]) -> list[uuid.UUID]:
        if not v:
            raise ValueError("product_ids must not be empty")
        return v


class RouteSegment(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    from_node_id: uuid.UUID
    to_node_id: uuid.UUID
    product_id: uuid.UUID | None
    path_nodes: list[uuid.UUID]
    distance_m: float
    estimated_seconds: int


class RouteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    layout_id: uuid.UUID
    start_node_id: uuid.UUID
    waypoints: list[uuid.UUID]
    segments: list[RouteSegment]
    total_distance_m: float
    total_estimated_seconds: int
