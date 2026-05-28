"""Products router stub — full implementation in Task 2."""
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/products", tags=["products"])


@router.get("")
async def list_products() -> None:
    raise HTTPException(status_code=501, detail="Not implemented yet")
