import io
import datetime
from typing import Dict, Any, Optional
import pandas as pd
from backend.app.services.data_service import (
    get_kpi_summary, get_revenue_by_route, get_revenue_by_flight, 
    get_ticket_transactions, get_revenue_by_class
)
from backend.app.services.forecasting_service import run_revenue_forecast

def generate_report_export(
    report_type: str,
    export_format: str = "csv",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    route: Optional[str] = None,
    flight_number: Optional[str] = None,
    booking_class: Optional[str] = None,
    ticket_status: Optional[str] = None,
    sales_channel: Optional[str] = None,
    airline: Optional[str] = None,
    currency: str = "USD"
) -> tuple[bytes, str, str]:
    """
    Generate filtered CSV or Excel export data for any requested report type.
    Returns (file_bytes, filename, mime_type).
    """
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

    if report_type == "revenue_summary":
        summary = get_kpi_summary(
            start_date=start_date, end_date=end_date, route=route,
            flight_number=flight_number, booking_class=booking_class,
            ticket_status=ticket_status, sales_channel=sales_channel,
            airline=airline, currency=currency
        )
        m = summary["metrics"]
        records = [
            {"Metric": "Total Revenue", "Value": m["total_revenue"]["value"], "Change (%)": m["total_revenue"]["change_pct"], "Currency": currency},
            {"Metric": "Tickets Sold", "Value": m["tickets_sold"]["value"], "Change (%)": m["tickets_sold"]["change_pct"], "Currency": currency},
            {"Metric": "Total Passengers", "Value": m["total_passengers"]["value"], "Change (%)": m["total_passengers"]["change_pct"], "Currency": currency},
            {"Metric": "Average Fare", "Value": m["average_fare"]["value"], "Change (%)": m["average_fare"]["change_pct"], "Currency": currency},
            {"Metric": "Load Factor (%)", "Value": m["load_factor"]["value"], "Change (%)": m["load_factor"]["change_pct"], "Currency": "%"},
            {"Metric": "RASK", "Value": m["rask"]["value"], "Change (%)": m["rask"]["change_pct"], "Currency": currency},
            {"Metric": "Yield", "Value": m["yield"]["value"], "Change (%)": m["yield"]["change_pct"], "Currency": currency},
            {"Metric": "Conversion Rate (%)", "Value": m["conversion_rate"]["value"], "Change (%)": m["conversion_rate"]["change_pct"], "Currency": "%"}
        ]
        df = pd.DataFrame(records)
        base_name = f"Revenue_Summary_Report_{timestamp}"

    elif report_type == "route_performance":
        routes = get_revenue_by_route(start_date=start_date, end_date=end_date, currency=currency)
        df = pd.DataFrame(routes)
        df.columns = [
            "Route Code", "Origin", "Destination", "Distance (km)", "Tickets Sold",
            "Passengers", f"Total Revenue ({currency})", f"Average Fare ({currency})",
            "Flights Count", "Seat Capacity", "Load Factor (%)", "RASK", "Yield"
        ]
        base_name = f"Route_Performance_Report_{timestamp}"

    elif report_type == "flight_performance":
        flight_data = get_revenue_by_flight(
            start_date=start_date, end_date=end_date, route=route,
            flight_number=flight_number, airline=airline, limit=2000, currency=currency
        )
        df = pd.DataFrame(flight_data["flights"])
        base_name = f"Flight_Performance_Report_{timestamp}"

    elif report_type == "ticket_sales":
        ticket_data = get_ticket_transactions(
            start_date=start_date, end_date=end_date, route=route,
            flight_number=flight_number, booking_class=booking_class,
            ticket_status=ticket_status, sales_channel=sales_channel,
            limit=5000, currency=currency
        )
        df = pd.DataFrame(ticket_data["tickets"])
        base_name = f"Ticket_Sales_Report_{timestamp}"

    elif report_type == "class_breakdown":
        class_data = get_revenue_by_class(start_date=start_date, end_date=end_date, route=route, currency=currency)
        df = pd.DataFrame(class_data["classes"])
        base_name = f"Booking_Class_Report_{timestamp}"

    elif report_type == "forecast":
        fc = run_revenue_forecast(horizon_days=30, metric="revenue", route=route, currency=currency)
        df = pd.DataFrame(fc["forecast"])
        df.columns = ["Target Date", f"Forecast Revenue ({currency})", "Lower 95% Bound", "Upper 95% Bound", "Horizon Day"]
        base_name = f"Revenue_Forecast_Report_{timestamp}"

    else:
        # Default to tickets
        ticket_data = get_ticket_transactions(start_date=start_date, end_date=end_date, limit=1000, currency=currency)
        df = pd.DataFrame(ticket_data["tickets"])
        base_name = f"Airline_Report_{timestamp}"

    # Render CSV or Excel
    if export_format.lower() == "excel" or export_format.lower() == "xlsx":
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Report")
        buffer.seek(0)
        return buffer.getvalue(), f"{base_name}.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else:
        csv_bytes = df.to_csv(index=False).encode("utf-8")
        return csv_bytes, f"{base_name}.csv", "text/csv"
