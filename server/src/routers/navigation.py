"""Navigation router stub — full implementation in Phase 3."""
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/navigation", tags=["navigation"])


@router.post("/route")
async def calculate_route() -> None:
    raise HTTPException(status_code=501, detail="Not implemented yet")
