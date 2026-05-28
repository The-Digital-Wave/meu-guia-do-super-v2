"""Layouts router stub — full implementation in Task 2."""
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/layouts", tags=["layouts"])


@router.get("")
async def list_layouts() -> None:
    raise HTTPException(status_code=501, detail="Not implemented yet")
