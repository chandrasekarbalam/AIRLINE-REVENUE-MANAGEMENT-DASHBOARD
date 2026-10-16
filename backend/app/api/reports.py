from fastapi import APIRouter, Query, Response
from typing import Optional
from backend.app.services.export_service import generate_report_export

router = APIRouter(prefix="/api/reports", tags=["Reports & Export"])

@router.get("/export")
async def export_report(
    report_type: str = Query("revenue_summary", description="revenue_summary, route_performance, flight_performance, ticket_sales, class_breakdown, forecast"),
    format: str = Query("csv", description="csv or excel"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    route: Optional[str] = Query(None),
    flight_number: Optional[str] = Query(None),
    booking_class: Optional[str] = Query(None),
    ticket_status: Optional[str] = Query(None),
    sales_channel: Optional[str] = Query(None),
    airline: Optional[str] = Query(None),
    currency: str = Query("USD")
):
    file_bytes, filename, media_type = generate_report_export(
        report_type=report_type,
        export_format=format,
        start_date=start_date,
        end_date=end_date,
        route=route,
        flight_number=flight_number,
        booking_class=booking_class,
        ticket_status=ticket_status,
        sales_channel=sales_channel,
        airline=airline,
        currency=currency
    )

    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"'
    }
    return Response(content=file_bytes, media_type=media_type, headers=headers)
