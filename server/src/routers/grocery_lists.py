"""Grocery lists router stub — full implementation in Task 2."""
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/grocery-lists", tags=["grocery-lists"])


@router.get("")
async def list_grocery_lists() -> None:
    raise HTTPException(status_code=501, detail="Not implemented yet")
