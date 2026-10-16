from fastapi import APIRouter, Query
from typing import Optional
from backend.app.services.data_service import get_demand_analysis

router = APIRouter(prefix="/api/demand", tags=["Passenger Demand"])

@router.get("/analysis")
async def get_demand(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    route: Optional[str] = Query(None),
    booking_class: Optional[str] = Query(None)
):
    return get_demand_analysis(
        start_date=start_date,
        end_date=end_date,
        route=route,
        booking_class=booking_class
    )
