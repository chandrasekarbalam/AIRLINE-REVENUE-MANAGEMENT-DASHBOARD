from fastapi import APIRouter, Query
from typing import Optional
from backend.app.services.data_service import get_inventory_summary

router = APIRouter(prefix="/api/inventory", tags=["Seat Inventory"])

@router.get("/summary")
async def get_inventory(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    route: Optional[str] = Query(None)
):
    return get_inventory_summary(
        start_date=start_date,
        end_date=end_date,
        route=route
    )
