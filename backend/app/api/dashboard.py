from fastapi import APIRouter, Query, Depends
from typing import Optional
from backend.app.services.data_service import get_kpi_summary
from backend.app.services.insights_service import generate_business_insights
from backend.app.database.connection import query_all

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary")
async def get_dashboard_summary(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    origin: Optional[str] = Query(None),
    destination: Optional[str] = Query(None),
    route: Optional[str] = Query(None),
    flight_number: Optional[str] = Query(None),
    booking_class: Optional[str] = Query(None),
    ticket_status: Optional[str] = Query(None),
    sales_channel: Optional[str] = Query(None),
    airline: Optional[str] = Query(None),
    currency: str = Query("USD")
):
    return get_kpi_summary(
        start_date=start_date,
        end_date=end_date,
        origin=origin,
        destination=destination,
        route=route,
        flight_number=flight_number,
        booking_class=booking_class,
        ticket_status=ticket_status,
        sales_channel=sales_channel,
        airline=airline,
        currency=currency
    )

@router.get("/insights")
async def get_dashboard_insights(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    currency: str = Query("USD")
):
    return generate_business_insights(
        start_date=start_date,
        end_date=end_date,
        currency=currency
    )

@router.get("/filter-options")
async def get_filter_options():
    """Retrieve distinct lists of airports, routes, flights, and airlines for filter UI."""
    airports = query_all("SELECT code, name, city FROM airports ORDER BY city ASC;")
    routes = query_all("SELECT route_code, origin_code, destination_code, distance_km FROM routes ORDER BY route_code ASC;")
    airlines = query_all("SELECT DISTINCT airline FROM flights ORDER BY airline ASC;")
    flight_numbers = query_all("SELECT DISTINCT flight_number FROM flights ORDER BY flight_number ASC LIMIT 100;")
    classes = [
        {"code": "Economy", "name": "Economy Class"},
        {"code": "Premium Economy", "name": "Premium Economy"},
        {"code": "Business", "name": "Business Class"},
        {"code": "First Class", "name": "First Class"}
    ]
    statuses = ["Confirmed", "Cancelled", "Refunded"]
    channels = ["Direct Web", "Mobile App", "OTA", "Travel Agency", "Corporate"]

    return {
        "airports": airports,
        "routes": routes,
        "airlines": [a["airline"] for a in airlines],
        "flight_numbers": [f["flight_number"] for f in flight_numbers],
        "booking_classes": classes,
        "statuses": statuses,
        "channels": channels
    }
