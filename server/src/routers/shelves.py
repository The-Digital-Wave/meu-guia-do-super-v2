"""Shelves router stub — full implementation in Task 2."""
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/shelves", tags=["shelves"])


@router.get("")
async def list_shelves() -> None:
    raise HTTPException(status_code=501, detail="Not implemented yet")
