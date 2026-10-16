from fastapi import APIRouter, Query
from typing import Optional
from backend.app.services.data_service import get_revenue_by_flight

router = APIRouter(prefix="/api/flights", tags=["Flight Performance"])

@router.get("/performance")
async def get_flight_performance(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    origin: Optional[str] = Query(None),
    destination: Optional[str] = Query(None),
    route: Optional[str] = Query(None),
    flight_number: Optional[str] = Query(None),
    airline: Optional[str] = Query(None),
    limit: int = Query(50),
    offset: int = Query(0),
    currency: str = Query("USD")
):
    return get_revenue_by_flight(
        start_date=start_date,
        end_date=end_date,
        origin=origin,
        destination=destination,
        route=route,
        flight_number=flight_number,
        airline=airline,
        limit=limit,
        offset=offset,
        currency=currency
    )
