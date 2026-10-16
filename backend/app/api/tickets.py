from fastapi import APIRouter, Query
from typing import Optional
from backend.app.services.data_service import get_ticket_transactions, get_channel_distribution

router = APIRouter(prefix="/api/tickets", tags=["Ticket Sales"])

@router.get("")
async def get_tickets(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    route: Optional[str] = Query(None),
    flight_number: Optional[str] = Query(None),
    booking_class: Optional[str] = Query(None),
    ticket_status: Optional[str] = Query(None),
    sales_channel: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50),
    offset: int = Query(0),
    currency: str = Query("USD")
):
    return get_ticket_transactions(
        start_date=start_date,
        end_date=end_date,
        route=route,
        flight_number=flight_number,
        booking_class=booking_class,
        ticket_status=ticket_status,
        sales_channel=sales_channel,
        search=search,
        limit=limit,
        offset=offset,
        currency=currency
    )

@router.get("/channels")
async def get_channels(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    currency: str = Query("USD")
):
    return get_channel_distribution(
        start_date=start_date,
        end_date=end_date,
        currency=currency
    )
