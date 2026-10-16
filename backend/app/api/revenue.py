from fastapi import APIRouter, Query
from typing import Optional
from backend.app.services.data_service import (
    get_revenue_trends, get_revenue_by_route, get_revenue_by_class,
    get_revenue_by_flight, get_revenue_by_travel_period,
    get_revenue_by_airline, get_revenue_by_channel
)

router = APIRouter(prefix="/api/revenue", tags=["Revenue Analytics"])

@router.get("/trends")
async def get_trends(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    interval: str = Query("daily"),
    metric: str = Query("revenue"),
    origin: Optional[str] = Query(None),
    destination: Optional[str] = Query(None),
    route: Optional[str] = Query(None),
    booking_class: Optional[str] = Query(None),
    airline: Optional[str] = Query(None),
    currency: str = Query("USD")
):
    return get_revenue_trends(
        start_date=start_date,
        end_date=end_date,
        interval=interval,
        metric=metric,
        origin=origin,
        destination=destination,
        route=route,
        booking_class=booking_class,
        airline=airline,
        currency=currency
    )

@router.get("/by-route")
async def get_by_route(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    sort_by: str = Query("revenue"),
    order: str = Query("desc"),
    currency: str = Query("USD")
):
    return get_revenue_by_route(
        start_date=start_date,
        end_date=end_date,
        sort_by=sort_by,
        order=order,
        currency=currency
    )

@router.get("/by-class")
async def get_by_class(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    route: Optional[str] = Query(None),
    airline: Optional[str] = Query(None),
    currency: str = Query("USD")
):
    return get_revenue_by_class(
        start_date=start_date,
        end_date=end_date,
        route=route,
        airline=airline,
        currency=currency
    )

@router.get("/by-airline")
async def get_by_airline(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    currency: str = Query("USD")
):
    return get_revenue_by_airline(
        start_date=start_date,
        end_date=end_date,
        currency=currency
    )

@router.get("/by-channel")
async def get_by_channel(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    currency: str = Query("USD")
):
    return get_revenue_by_channel(
        start_date=start_date,
        end_date=end_date,
        currency=currency
    )

@router.get("/by-flight")
async def get_by_flight(
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

@router.get("/by-period")
async def get_by_period(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    route: Optional[str] = Query(None),
    currency: str = Query("USD")
):
    return get_revenue_by_travel_period(
        start_date=start_date,
        end_date=end_date,
        route=route,
        currency=currency
    )
