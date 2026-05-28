"""Edges router stub — full implementation in Task 2."""
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/edges", tags=["edges"])


@router.get("")
async def list_edges() -> None:
    raise HTTPException(status_code=501, detail="Not implemented yet")
