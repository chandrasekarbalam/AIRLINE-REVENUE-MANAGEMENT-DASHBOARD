import datetime
from typing import Optional, List, Dict, Any
from backend.app.database.connection import query_all, query_one, get_db
from backend.app.services.cache_service import cache

EXCHANGE_RATE_USD_TO_INR = 85.0

def convert_currency(amount: float, target_currency: str = "USD") -> float:
    if target_currency.upper() == "INR":
        return round(amount * EXCHANGE_RATE_USD_TO_INR, 2)
    return round(amount, 2)

def build_filter_clauses(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    origin: Optional[str] = None,
    destination: Optional[str] = None,
    route: Optional[str] = None,
    flight_number: Optional[str] = None,
    booking_class: Optional[str] = None,
    ticket_status: Optional[str] = None,
    sales_channel: Optional[str] = None,
    airline: Optional[str] = None,
    date_field: str = "t.travel_date"
) -> tuple[str, list]:
    conditions = []
    params = []

    if start_date:
        conditions.append(f"{date_field} >= ?")
        params.append(start_date)
    if end_date:
        conditions.append(f"{date_field} <= ?")
        params.append(end_date)
    if origin:
        conditions.append("f.origin = ?")
        params.append(origin.upper())
    if destination:
        conditions.append("f.destination = ?")
        params.append(destination.upper())
    if route:
        conditions.append("f.route_code = ?")
        params.append(route.upper())
    if flight_number:
        conditions.append("f.flight_number = ?")
        params.append(flight_number.upper())
    if booking_class:
        conditions.append("t.booking_class = ?")
        params.append(booking_class)
    if ticket_status:
        conditions.append("t.ticket_status = ?")
        params.append(ticket_status)
    if sales_channel:
        conditions.append("b.sales_channel = ?")
        params.append(sales_channel)
    if airline:
        conditions.append("f.airline = ?")
        params.append(airline)

    where_sql = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    return where_sql, params

def get_kpi_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    origin: Optional[str] = None,
    destination: Optional[str] = None,
    route: Optional[str] = None,
    flight_number: Optional[str] = None,
    booking_class: Optional[str] = None,
    ticket_status: Optional[str] = None,
    sales_channel: Optional[str] = None,
    airline: Optional[str] = None,
    currency: str = "USD"
) -> Dict[str, Any]:
    """Calculate executive KPI metrics with period comparison and 13 enterprise metrics."""
    cache_key = f"kpi:{start_date}:{end_date}:{origin}:{destination}:{route}:{flight_number}:{booking_class}:{ticket_status}:{sales_channel}:{airline}:{currency}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    # Determine date range for current and prior periods
    if not end_date:
        end_date = datetime.date.today().strftime("%Y-%m-%d")
    if not start_date:
        start_date = (datetime.date.today() - datetime.timedelta(days=90)).strftime("%Y-%m-%d")

    curr_start_dt = datetime.datetime.strptime(start_date, "%Y-%m-%d").date()
    curr_end_dt = datetime.datetime.strptime(end_date, "%Y-%m-%d").date()
    duration_days = (curr_end_dt - curr_start_dt).days + 1

    prior_end_dt = curr_start_dt - datetime.timedelta(days=1)
    prior_start_dt = prior_end_dt - datetime.timedelta(days=duration_days - 1)
    prior_start = prior_start_dt.strftime("%Y-%m-%d")
    prior_end = prior_end_dt.strftime("%Y-%m-%d")

    def fetch_period_metrics(p_start: str, p_end: str):
        where_sql, params = build_filter_clauses(
            start_date=p_start,
            end_date=p_end,
            origin=origin,
            destination=destination,
            route=route,
            flight_number=flight_number,
            booking_class=booking_class,
            ticket_status=ticket_status,
            sales_channel=sales_channel,
            airline=airline,
            date_field="t.travel_date"
        )

        join_flights = bool(origin or destination or route or flight_number or airline)
        join_bookings = bool(sales_channel)

        joins = []
        if join_flights:
            joins.append("JOIN flights f ON t.flight_id = f.id")
        if join_bookings:
            joins.append("JOIN bookings b ON t.booking_id = b.id")
        join_str = " ".join(joins)

        query = f"""
        SELECT 
            COUNT(CASE WHEN t.ticket_status = 'Confirmed' THEN t.id END) as total_confirmed_tickets,
            COUNT(CASE WHEN t.ticket_status = 'Cancelled' THEN t.id END) as total_cancelled_tickets,
            COUNT(CASE WHEN t.ticket_status = 'Refunded' THEN t.id END) as total_refunded_tickets,
            COUNT(t.id) as total_tickets,
            COUNT(DISTINCT CASE WHEN t.ticket_status = 'Confirmed' THEN t.passenger_id END) as total_passengers,
            COUNT(DISTINCT CASE WHEN t.ticket_status = 'Confirmed' THEN t.booking_id END) as total_bookings,
            COALESCE(SUM(CASE WHEN t.ticket_status = 'Confirmed' THEN t.fare_amount ELSE 0 END), 0.0) as gross_revenue,
            COALESCE(SUM(CASE WHEN t.ticket_status = 'Refunded' THEN t.fare_amount ELSE 0 END), 0.0) as refund_revenue,
            COALESCE(SUM(CASE WHEN t.ticket_status = 'Confirmed' THEN t.tax_amount ELSE 0 END), 0.0) as total_taxes,
            COALESCE(SUM(CASE WHEN t.ticket_status = 'Confirmed' THEN t.discount_amount ELSE 0 END), 0.0) as total_discounts
        FROM tickets t
        {join_str}
        {where_sql};
        """
        res = query_one(query, tuple(params)) or {}

        # Fetch capacity and distance metrics for ASK & RPK
        flight_where_clauses = ["f.departure_date >= ?", "f.departure_date <= ?"]
        f_params = [p_start, p_end]
        if origin:
            flight_where_clauses.append("f.origin = ?")
            f_params.append(origin.upper())
        if destination:
            flight_where_clauses.append("f.destination = ?")
            f_params.append(destination.upper())
        if route:
            flight_where_clauses.append("f.route_code = ?")
            f_params.append(route.upper())
        if flight_number:
            flight_where_clauses.append("f.flight_number = ?")
            f_params.append(flight_number.upper())
        if airline:
            flight_where_clauses.append("f.airline = ?")
            f_params.append(airline)

        f_where = "WHERE " + " AND ".join(flight_where_clauses)
        flight_query = f"""
        SELECT 
            COUNT(f.id) as total_flights,
            COALESCE(SUM(f.seat_capacity), 0) as total_seat_capacity,
            COALESCE(SUM(f.seat_capacity * r.distance_km), 0.0) as total_ask,
            COALESCE(SUM(si.booked_seats), 0) as total_booked_seats,
            COALESCE(SUM(si.booked_seats * r.distance_km), 0.0) as total_rpk
        FROM flights f
        JOIN routes r ON f.route_id = r.id
        LEFT JOIN seat_inventory si ON f.id = si.flight_id
        {f_where};
        """
        f_res = query_one(flight_query, tuple(f_params)) or {}

        gross_rev = res.get("gross_revenue", 0.0)
        refund_rev = res.get("refund_revenue", 0.0)
        net_rev = max(0.0, gross_rev - refund_rev)
        taxes = res.get("total_taxes", 0.0)
        discounts = res.get("total_discounts", 0.0)
        gross_ticket_sales = gross_rev + taxes - discounts

        confirmed_tickets = res.get("total_confirmed_tickets", 0)
        total_tickets = res.get("total_tickets", 0)
        passengers = res.get("total_passengers", 0)
        bookings = res.get("total_bookings", 0)
        cancelled_tickets = res.get("total_cancelled_tickets", 0)
        refunded_tickets = res.get("total_refunded_tickets", 0)

        seat_capacity = f_res.get("total_seat_capacity", 0)
        ask = f_res.get("total_ask", 0.0)
        rpk = f_res.get("total_rpk", 0.0)
        booked_seats = f_res.get("total_booked_seats", 0)

        avg_fare = (gross_rev / confirmed_tickets) if confirmed_tickets > 0 else 0.0
        load_factor = (booked_seats / seat_capacity * 100) if seat_capacity > 0 else 0.0
        rask = (gross_rev / ask) if ask > 0 else 0.0
        yield_val = (gross_rev / rpk) if rpk > 0 else 0.0
        conversion_rate = (confirmed_tickets / total_tickets * 100) if total_tickets > 0 else 0.0
        cancellation_rate = (cancelled_tickets / total_tickets * 100) if total_tickets > 0 else 0.0

        return {
            "total_revenue": gross_rev,
            "net_revenue": net_rev,
            "gross_ticket_sales": gross_ticket_sales,
            "tickets_sold": confirmed_tickets,
            "total_tickets": total_tickets,
            "total_bookings": bookings,
            "cancelled_tickets": cancelled_tickets,
            "refunded_tickets": refunded_tickets,
            "refund_amount": refund_rev,
            "total_passengers": passengers,
            "avg_fare": avg_fare,
            "load_factor": round(load_factor, 2),
            "rask": round(rask, 4),
            "yield": round(yield_val, 4),
            "conversion_rate": round(conversion_rate, 2),
            "cancellation_rate": round(cancellation_rate, 2),
            "total_flights": f_res.get("total_flights", 0),
            "total_capacity": seat_capacity,
            "ask": ask,
            "rpk": rpk
        }

    current_data = fetch_period_metrics(start_date, end_date)
    prior_data = fetch_period_metrics(prior_start, prior_end)

    def calc_pct_change(curr: float, prior: float) -> Optional[float]:
        if prior is None or prior == 0:
            return None
        return round(((curr - prior) / prior) * 100, 2)

    # Format values based on chosen currency
    curr_multiplier = EXCHANGE_RATE_USD_TO_INR if currency.upper() == "INR" else 1.0

    result = {
        "currency": currency.upper(),
        "date_range": {"start": start_date, "end": end_date},
        "prior_range": {"start": prior_start, "end": prior_end},
        "metrics": {
            "total_revenue": {
                "value": round(current_data["total_revenue"] * curr_multiplier, 2),
                "prior_value": round(prior_data["total_revenue"] * curr_multiplier, 2) if prior_data["total_revenue"] > 0 else None,
                "change_pct": calc_pct_change(current_data["total_revenue"], prior_data["total_revenue"]),
                "calculation": "Total gross revenue from confirmed ticket sales in the selected period."
            },
            "net_revenue": {
                "value": round(current_data["net_revenue"] * curr_multiplier, 2),
                "prior_value": round(prior_data["net_revenue"] * curr_multiplier, 2) if prior_data["net_revenue"] > 0 else None,
                "change_pct": calc_pct_change(current_data["net_revenue"], prior_data["net_revenue"]),
                "calculation": "Net revenue after subtracting passenger ticket refunds."
            },
            "gross_ticket_sales": {
                "value": round(current_data["gross_ticket_sales"] * curr_multiplier, 2),
                "prior_value": round(prior_data["gross_ticket_sales"] * curr_multiplier, 2) if prior_data["gross_ticket_sales"] > 0 else None,
                "change_pct": calc_pct_change(current_data["gross_ticket_sales"], prior_data["gross_ticket_sales"]),
                "calculation": "Gross sales including base fares and applicable taxes minus discounts."
            },
            "tickets_sold": {
                "value": current_data["tickets_sold"],
                "prior_value": prior_data["tickets_sold"] if prior_data["tickets_sold"] > 0 else None,
                "change_pct": calc_pct_change(current_data["tickets_sold"], prior_data["tickets_sold"]),
                "calculation": "Total number of completed and confirmed passenger tickets sold."
            },
            "total_bookings": {
                "value": current_data["total_bookings"],
                "prior_value": prior_data["total_bookings"] if prior_data["total_bookings"] > 0 else None,
                "change_pct": calc_pct_change(current_data["total_bookings"], prior_data["total_bookings"]),
                "calculation": "Total completed booking reservations recorded in the system."
            },
            "total_passengers": {
                "value": current_data["total_passengers"],
                "prior_value": prior_data["total_passengers"] if prior_data["total_passengers"] > 0 else None,
                "change_pct": calc_pct_change(current_data["total_passengers"], prior_data["total_passengers"]),
                "calculation": "Distinct passengers represented across confirmed tickets without duplicate counts."
            },
            "average_fare": {
                "value": round(current_data["avg_fare"] * curr_multiplier, 2),
                "prior_value": round(prior_data["avg_fare"] * curr_multiplier, 2) if prior_data["avg_fare"] > 0 else None,
                "change_pct": calc_pct_change(current_data["avg_fare"], prior_data["avg_fare"]),
                "calculation": "Total passenger ticket revenue divided by total confirmed tickets sold."
            },
            "load_factor": {
                "value": current_data["load_factor"],
                "prior_value": prior_data["load_factor"] if prior_data["load_factor"] > 0 else None,
                "change_pct": calc_pct_change(current_data["load_factor"], prior_data["load_factor"]),
                "calculation": "Occupied passenger seats divided by total available seat capacity multiplied by 100."
            },
            "rask": {
                "value": round(current_data["rask"] * curr_multiplier, 4),
                "prior_value": round(prior_data["rask"] * curr_multiplier, 4) if prior_data["rask"] > 0 else None,
                "change_pct": calc_pct_change(current_data["rask"], prior_data["rask"]),
                "calculation": "Revenue per Available Seat Kilometer: Passenger revenue divided by Available Seat Kilometers (ASK)."
            },
            "yield": {
                "value": round(current_data["yield"] * curr_multiplier, 4),
                "prior_value": round(prior_data["yield"] * curr_multiplier, 4) if prior_data["yield"] > 0 else None,
                "change_pct": calc_pct_change(current_data["yield"], prior_data["yield"]),
                "calculation": "Yield: Passenger revenue divided by Revenue Passenger Kilometers (RPK)."
            },
            "conversion_rate": {
                "value": current_data["conversion_rate"],
                "prior_value": prior_data["conversion_rate"] if prior_data["conversion_rate"] > 0 else None,
                "change_pct": calc_pct_change(current_data["conversion_rate"], prior_data["conversion_rate"]),
                "calculation": "Confirmed tickets divided by total booking attempts recorded multiplied by 100."
            },
            "refund_amount": {
                "value": round(current_data["refund_amount"] * curr_multiplier, 2),
                "prior_value": round(prior_data["refund_amount"] * curr_multiplier, 2) if prior_data["refund_amount"] > 0 else None,
                "change_pct": calc_pct_change(current_data["refund_amount"], prior_data["refund_amount"]),
                "calculation": "Total value refunded to passengers for cancelled or refunded tickets."
            },
            "cancellation_rate": {
                "value": current_data["cancellation_rate"],
                "prior_value": prior_data["cancellation_rate"] if prior_data["cancellation_rate"] > 0 else None,
                "change_pct": calc_pct_change(current_data["cancellation_rate"], prior_data["cancellation_rate"]),
                "calculation": "Cancelled tickets divided by total tickets issued multiplied by 100."
            }
        },
        "breakdown": {
            "confirmed_tickets": current_data["tickets_sold"],
            "cancelled_tickets": current_data["cancelled_tickets"],
            "refunded_tickets": current_data["refunded_tickets"],
            "total_flights": current_data["total_flights"],
            "total_capacity": current_data["total_capacity"]
        }
    }

    cache.set(cache_key, result, ttl=60)
    return result

def get_revenue_trends(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    interval: str = "daily",  # daily, weekly, monthly
    metric: str = "revenue",  # revenue, tickets, average_fare
    origin: Optional[str] = None,
    destination: Optional[str] = None,
    route: Optional[str] = None,
    booking_class: Optional[str] = None,
    airline: Optional[str] = None,
    currency: str = "USD"
) -> Dict[str, Any]:
    """Retrieve chronological revenue trend with current vs prior period."""
    if not end_date:
        end_date = datetime.date.today().strftime("%Y-%m-%d")
    if not start_date:
        start_date = (datetime.date.today() - datetime.timedelta(days=90)).strftime("%Y-%m-%d")

    curr_start_dt = datetime.datetime.strptime(start_date, "%Y-%m-%d").date()
    curr_end_dt = datetime.datetime.strptime(end_date, "%Y-%m-%d").date()
    duration_days = (curr_end_dt - curr_start_dt).days + 1
    prior_start = (curr_start_dt - datetime.timedelta(days=duration_days)).strftime("%Y-%m-%d")
    prior_end = (curr_start_dt - datetime.timedelta(days=1)).strftime("%Y-%m-%d")

    where_sql, params = build_filter_clauses(
        start_date=start_date,
        end_date=end_date,
        origin=origin,
        destination=destination,
        route=route,
        booking_class=booking_class,
        airline=airline,
        ticket_status="Confirmed",
        date_field="t.travel_date"
    )

    if interval == "monthly":
        date_group = "SUBSTR(t.travel_date, 1, 7)"
    elif interval == "weekly":
        # Group by week format YYYY-Www
        date_group = "STRFTIME('%Y-W%W', t.travel_date)"
    else:
        date_group = "t.travel_date"

    query = f"""
    SELECT 
        {date_group} as period_label,
        MIN(t.travel_date) as start_date,
        COUNT(t.id) as tickets,
        SUM(t.fare_amount) as revenue,
        AVG(t.fare_amount) as avg_fare
    FROM tickets t
    JOIN flights f ON t.flight_id = f.id
    JOIN bookings b ON t.booking_id = b.id
    {where_sql}
    GROUP BY {date_group}
    ORDER BY period_label ASC;
    """
    rows = query_all(query, tuple(params))

    # Query prior period for comparison
    prior_where_sql, prior_params = build_filter_clauses(
        start_date=prior_start,
        end_date=prior_end,
        origin=origin,
        destination=destination,
        route=route,
        booking_class=booking_class,
        airline=airline,
        ticket_status="Confirmed",
        date_field="t.travel_date"
    )

    prior_query = f"""
    SELECT 
        {date_group} as period_label,
        COUNT(t.id) as tickets,
        SUM(t.fare_amount) as revenue,
        AVG(t.fare_amount) as avg_fare
    FROM tickets t
    JOIN flights f ON t.flight_id = f.id
    JOIN bookings b ON t.booking_id = b.id
    {prior_where_sql}
    GROUP BY {date_group}
    ORDER BY period_label ASC;
    """
    prior_rows = query_all(prior_query, tuple(prior_params))

    curr_mult = EXCHANGE_RATE_USD_TO_INR if currency.upper() == "INR" else 1.0

    trend_points = []
    for idx, r in enumerate(rows):
        prior_r = prior_rows[idx] if idx < len(prior_rows) else None
        
        rev = round(r["revenue"] * curr_mult, 2)
        p_rev = round(prior_r["revenue"] * curr_mult, 2) if prior_r else None
        avg_f = round(r["avg_fare"] * curr_mult, 2)
        p_avg_f = round(prior_r["avg_fare"] * curr_mult, 2) if prior_r else None

        trend_points.append({
            "period": r["period_label"],
            "date": r["start_date"],
            "revenue": rev,
            "prior_revenue": p_rev,
            "tickets": r["tickets"],
            "prior_tickets": prior_r["tickets"] if prior_r else None,
            "average_fare": avg_f,
            "prior_average_fare": p_avg_f
        })

    return {
        "interval": interval,
        "currency": currency.upper(),
        "data": trend_points
    }

def get_revenue_by_route(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    sort_by: str = "revenue",  # revenue, tickets, avg_fare, load_factor
    order: str = "desc",
    currency: str = "USD"
) -> List[Dict[str, Any]]:
    """Rank routes by revenue, tickets, passenger load factor, and average fare."""
    where_sql, params = build_filter_clauses(
        start_date=start_date,
        end_date=end_date,
        ticket_status="Confirmed",
        date_field="t.travel_date"
    )

    query = f"""
    SELECT 
        f.route_code,
        f.origin,
        f.destination,
        r.distance_km,
        COUNT(t.id) as tickets_sold,
        COUNT(DISTINCT t.passenger_id) as passengers,
        SUM(t.fare_amount) as total_revenue,
        AVG(t.fare_amount) as avg_fare,
        COUNT(DISTINCT f.id) as flights_count
    FROM tickets t
    JOIN flights f ON t.flight_id = f.id
    JOIN routes r ON f.route_id = r.id
    JOIN bookings b ON t.booking_id = b.id
    {where_sql}
    GROUP BY f.route_code, f.origin, f.destination, r.distance_km;
    """
    rows = query_all(query, tuple(params))

    # Fetch capacity per route for accurate load factor and RASK
    flight_where, f_params = build_filter_clauses(start_date=start_date, end_date=end_date, date_field="f.departure_date")
    cap_query = f"""
    SELECT 
        f.route_code,
        SUM(f.seat_capacity) as total_capacity,
        SUM(si.booked_seats) as booked_seats
    FROM flights f
    LEFT JOIN seat_inventory si ON f.id = si.flight_id
    {flight_where}
    GROUP BY f.route_code;
    """
    cap_rows = {c["route_code"]: c for c in query_all(cap_query, tuple(f_params))}

    curr_mult = EXCHANGE_RATE_USD_TO_INR if currency.upper() == "INR" else 1.0

    result = []
    for r in rows:
        code = r["route_code"]
        cap_info = cap_rows.get(code, {})
        cap = cap_info.get("total_capacity", 1) or 1
        booked = cap_info.get("booked_seats", r["tickets_sold"])
        lf = round((booked / cap * 100), 2) if cap > 0 else 0.0

        dist = r["distance_km"]
        ask = cap * dist
        rpk = booked * dist
        tot_rev = round(r["total_revenue"] * curr_mult, 2)
        rask = round((tot_rev / ask), 4) if ask > 0 else 0.0
        yield_val = round((tot_rev / rpk), 4) if rpk > 0 else 0.0

        result.append({
            "route_code": code,
            "origin": r["origin"],
            "destination": r["destination"],
            "distance_km": dist,
            "tickets_sold": r["tickets_sold"],
            "passengers": r["passengers"],
            "total_revenue": tot_rev,
            "avg_fare": round(r["avg_fare"] * curr_mult, 2),
            "flights_count": r["flights_count"],
            "seat_capacity": cap,
            "load_factor": lf,
            "rask": rask,
            "yield": yield_val
        })

    reverse = (order.lower() == "desc")
    if sort_by in ["revenue", "total_revenue"]:
        result.sort(key=lambda x: x["total_revenue"], reverse=reverse)
    elif sort_by in ["tickets", "tickets_sold"]:
        result.sort(key=lambda x: x["tickets_sold"], reverse=reverse)
    elif sort_by in ["avg_fare", "average_fare"]:
        result.sort(key=lambda x: x["avg_fare"], reverse=reverse)
    elif sort_by == "load_factor":
        result.sort(key=lambda x: x["load_factor"], reverse=reverse)
    else:
        result.sort(key=lambda x: x["total_revenue"], reverse=True)

    return result

def get_revenue_by_class(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    route: Optional[str] = None,
    airline: Optional[str] = None,
    currency: str = "USD"
) -> Dict[str, Any]:
    """Retrieve revenue and ticket distribution across booking classes."""
    where_sql, params = build_filter_clauses(
        start_date=start_date,
        end_date=end_date,
        route=route,
        airline=airline,
        ticket_status="Confirmed",
        date_field="t.travel_date"
    )

    query = f"""
    SELECT 
        t.booking_class,
        COUNT(t.id) as tickets_sold,
        SUM(t.fare_amount) as total_revenue,
        AVG(t.fare_amount) as avg_fare
    FROM tickets t
    JOIN flights f ON t.flight_id = f.id
    JOIN bookings b ON t.booking_id = b.id
    {where_sql}
    GROUP BY t.booking_class;
    """
    rows = query_all(query, tuple(params))
    total_rev = sum(r["total_revenue"] for r in rows) if rows else 1.0
    total_tix = sum(r["tickets_sold"] for r in rows) if rows else 1

    curr_mult = EXCHANGE_RATE_USD_TO_INR if currency.upper() == "INR" else 1.0

    class_data = []
    # Palette colors for classes
    color_map = {
        "Economy": "#0284c7",          # Aviation sky blue
        "Premium Economy": "#38bdf8",  # Light cyan blue
        "Business": "#1e3a8a",         # Deep navy blue
        "First Class": "#d97706"       # Amber luxury gold
    }

    for r in rows:
        b_class = r["booking_class"]
        rev = round(r["total_revenue"] * curr_mult, 2)
        pct = round((r["total_revenue"] / total_rev * 100), 2)
        class_data.append({
            "booking_class": b_class,
            "tickets_sold": r["tickets_sold"],
            "total_revenue": rev,
            "avg_fare": round(r["avg_fare"] * curr_mult, 2),
            "percentage": pct,
            "color": color_map.get(b_class, "#64748b")
        })

    class_data.sort(key=lambda x: x["total_revenue"], reverse=True)
    return {
        "currency": currency.upper(),
        "total_revenue": round(total_rev * curr_mult, 2),
        "total_tickets": total_tix,
        "classes": class_data
    }

def get_revenue_by_travel_period(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    route: Optional[str] = None,
    currency: str = "USD"
) -> Dict[str, Any]:
    """Analyze revenue and demand by Day of Week and Month."""
    where_sql, params = build_filter_clauses(
        start_date=start_date,
        end_date=end_date,
        route=route,
        ticket_status="Confirmed",
        date_field="t.travel_date"
    )

    curr_mult = EXCHANGE_RATE_USD_TO_INR if currency.upper() == "INR" else 1.0

    # Day of week analysis (0=Sunday in SQLite strftime %w)
    dow_query = f"""
    SELECT 
        STRFTIME('%w', t.travel_date) as day_num,
        COUNT(t.id) as tickets,
        SUM(t.fare_amount) as revenue,
        AVG(t.fare_amount) as avg_fare
    FROM tickets t
    JOIN flights f ON t.flight_id = f.id
    JOIN bookings b ON t.booking_id = b.id
    {where_sql}
    GROUP BY day_num
    ORDER BY day_num ASC;
    """
    dow_rows = query_all(dow_query, tuple(params))
    dow_names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    day_of_week = []
    for num_str in range(7):
        row = next((r for r in dow_rows if int(r["day_num"]) == num_str), None)
        day_of_week.append({
            "day_index": num_str,
            "day_name": dow_names[num_str],
            "tickets": row["tickets"] if row else 0,
            "revenue": round(row["revenue"] * curr_mult, 2) if row else 0.0,
            "avg_fare": round(row["avg_fare"] * curr_mult, 2) if row else 0.0
        })

    # Monthly breakdown
    month_query = f"""
    SELECT 
        SUBSTR(t.travel_date, 1, 7) as year_month,
        COUNT(t.id) as tickets,
        SUM(t.fare_amount) as revenue,
        AVG(t.fare_amount) as avg_fare
    FROM tickets t
    JOIN flights f ON t.flight_id = f.id
    JOIN bookings b ON t.booking_id = b.id
    {where_sql}
    GROUP BY year_month
    ORDER BY year_month ASC;
    """
    month_rows = query_all(month_query, tuple(params))
    monthly = [{
        "month": m["year_month"],
        "tickets": m["tickets"],
        "revenue": round(m["revenue"] * curr_mult, 2),
        "avg_fare": round(m["avg_fare"] * curr_mult, 2)
    } for m in month_rows]

    return {
        "currency": currency.upper(),
        "day_of_week": day_of_week,
        "monthly": monthly
    }

def get_revenue_by_flight(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    origin: Optional[str] = None,
    destination: Optional[str] = None,
    route: Optional[str] = None,
    flight_number: Optional[str] = None,
    airline: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    currency: str = "USD"
) -> Dict[str, Any]:
    """Retrieve flight-level revenue and seat utilization performance table."""
    where_sql, params = build_filter_clauses(
        start_date=start_date,
        end_date=end_date,
        origin=origin,
        destination=destination,
        route=route,
        flight_number=flight_number,
        airline=airline,
        date_field="f.departure_date"
    )

    count_query = f"SELECT COUNT(*) as total FROM flights f {where_sql};"
    total_count = (query_one(count_query, tuple(params)) or {}).get("total", 0)

    query = f"""
    SELECT 
        f.id as flight_id,
        f.flight_number,
        f.airline,
        f.route_code,
        f.origin,
        f.destination,
        f.departure_date,
        f.departure_time,
        f.aircraft_type,
        f.seat_capacity,
        f.status as flight_status,
        COALESCE(si.booked_seats, 0) as tickets_sold,
        COALESCE(si.available_seats, f.seat_capacity) as available_seats,
        COALESCE(si.load_factor, 0.0) as load_factor,
        COALESCE((
            SELECT SUM(t.fare_amount) 
            FROM tickets t 
            WHERE t.flight_id = f.id AND t.ticket_status = 'Confirmed'
        ), 0.0) as total_revenue
    FROM flights f
    LEFT JOIN seat_inventory si ON f.id = si.flight_id
    {where_sql}
    ORDER BY f.departure_date DESC, f.departure_time DESC
    LIMIT ? OFFSET ?;
    """
    rows = query_all(query, tuple(params + [limit, offset]))

    curr_mult = EXCHANGE_RATE_USD_TO_INR if currency.upper() == "INR" else 1.0

    items = []
    for r in rows:
        rev = round(r["total_revenue"] * curr_mult, 2)
        sold = r["tickets_sold"]
        avg_f = round(rev / sold, 2) if sold > 0 else 0.0

        items.append({
            "flight_id": r["flight_id"],
            "flight_number": r["flight_number"],
            "airline": r["airline"],
            "route_code": r["route_code"],
            "origin": r["origin"],
            "destination": r["destination"],
            "departure_date": r["departure_date"],
            "departure_time": r["departure_time"],
            "aircraft_type": r["aircraft_type"],
            "seat_capacity": r["seat_capacity"],
            "tickets_sold": sold,
            "available_seats": r["available_seats"],
            "load_factor": r["load_factor"],
            "total_revenue": rev,
            "avg_fare": avg_f,
            "status": r["flight_status"]
        })

    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "currency": currency.upper(),
        "flights": items
    }

def get_ticket_transactions(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    route: Optional[str] = None,
    flight_number: Optional[str] = None,
    booking_class: Optional[str] = None,
    ticket_status: Optional[str] = None,
    sales_channel: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    currency: str = "USD"
) -> Dict[str, Any]:
    """Paginated ticket transactions with deep search and channel stats."""
    where_sql, params = build_filter_clauses(
        start_date=start_date,
        end_date=end_date,
        route=route,
        flight_number=flight_number,
        booking_class=booking_class,
        ticket_status=ticket_status,
        sales_channel=sales_channel,
        date_field="t.travel_date"
    )

    if search:
        search_filter = "(t.ticket_number LIKE ? OR b.booking_reference LIKE ? OR t.passenger_name LIKE ? OR f.flight_number LIKE ?)"
        search_param = f"%{search}%"
        if where_sql:
            where_sql += f" AND {search_filter}"
        else:
            where_sql = f"WHERE {search_filter}"
        params.extend([search_param, search_param, search_param, search_param])

    count_query = f"""
    SELECT COUNT(*) as total 
    FROM tickets t
    JOIN flights f ON t.flight_id = f.id
    JOIN bookings b ON t.booking_id = b.id
    {where_sql};
    """
    total = (query_one(count_query, tuple(params)) or {}).get("total", 0)

    query = f"""
    SELECT 
        t.id as ticket_id,
        t.ticket_number,
        b.booking_reference,
        t.passenger_name,
        t.passenger_id,
        f.flight_number,
        f.route_code,
        f.origin,
        f.destination,
        t.booked_at,
        t.travel_date,
        t.booking_class,
        t.fare_amount,
        t.tax_amount,
        t.discount_amount,
        t.total_price,
        t.ticket_status,
        b.sales_channel,
        t.seat_number
    FROM tickets t
    JOIN flights f ON t.flight_id = f.id
    JOIN bookings b ON t.booking_id = b.id
    {where_sql}
    ORDER BY t.travel_date DESC, t.id DESC
    LIMIT ? OFFSET ?;
    """
    rows = query_all(query, tuple(params + [limit, offset]))

    curr_mult = EXCHANGE_RATE_USD_TO_INR if currency.upper() == "INR" else 1.0

    tickets = [{
        "ticket_id": r["ticket_id"],
        "ticket_number": r["ticket_number"],
        "booking_reference": r["booking_reference"],
        "passenger_name": r["passenger_name"],
        "passenger_id": r["passenger_id"],
        "flight_number": r["flight_number"],
        "route_code": r["route_code"],
        "origin": r["origin"],
        "destination": r["destination"],
        "booking_date": r["booked_at"],
        "travel_date": r["travel_date"],
        "booking_class": r["booking_class"],
        "fare_amount": round(r["fare_amount"] * curr_mult, 2),
        "tax_amount": round(r["tax_amount"] * curr_mult, 2),
        "discount_amount": round(r["discount_amount"] * curr_mult, 2),
        "total_price": round(r["total_price"] * curr_mult, 2),
        "ticket_status": r["ticket_status"],
        "sales_channel": r["sales_channel"],
        "seat_number": r["seat_number"]
    } for r in rows]

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "currency": currency.upper(),
        "tickets": tickets
    }

def get_channel_distribution(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    currency: str = "USD"
) -> List[Dict[str, Any]]:
    """Retrieve ticket sales distribution by booking sales channel."""
    where_sql, params = build_filter_clauses(start_date=start_date, end_date=end_date, date_field="b.booking_date")
    query = f"""
    SELECT 
        b.sales_channel,
        COUNT(b.id) as bookings_count,
        SUM(b.total_amount) as total_revenue
    FROM bookings b
    {where_sql}
    GROUP BY b.sales_channel
    ORDER BY total_revenue DESC;
    """
    rows = query_all(query, tuple(params))
    tot_rev = sum(r["total_revenue"] for r in rows) if rows else 1.0
    curr_mult = EXCHANGE_RATE_USD_TO_INR if currency.upper() == "INR" else 1.0

    return [{
        "channel": r["sales_channel"],
        "bookings": r["bookings_count"],
        "revenue": round(r["total_revenue"] * curr_mult, 2),
        "percentage": round(r["total_revenue"] / tot_rev * 100, 2)
    } for r in rows]

def get_demand_analysis(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    route: Optional[str] = None,
    booking_class: Optional[str] = None
) -> Dict[str, Any]:
    """Retrieve passenger booking pace, lead times, and capacity vs demand curves."""
    where_sql, params = build_filter_clauses(
        start_date=start_date,
        end_date=end_date,
        route=route,
        booking_class=booking_class,
        ticket_status="Confirmed",
        date_field="t.travel_date"
    )

    # Lead time distribution (days prior to departure when ticket was booked)
    lead_query = f"""
    SELECT 
        CASE 
            WHEN b.booking_lead_days <= 3 THEN '0-3 Days (Last Minute)'
            WHEN b.booking_lead_days <= 7 THEN '4-7 Days'
            WHEN b.booking_lead_days <= 14 THEN '8-14 Days'
            WHEN b.booking_lead_days <= 30 THEN '15-30 Days'
            WHEN b.booking_lead_days <= 60 THEN '31-60 Days'
            ELSE '60+ Days (Advance)'
        END as lead_bracket,
        COUNT(t.id) as ticket_count,
        AVG(t.fare_amount) as avg_fare
    FROM tickets t
    JOIN bookings b ON t.booking_id = b.id
    JOIN flights f ON t.flight_id = f.id
    {where_sql}
    GROUP BY lead_bracket
    ORDER BY MIN(b.booking_lead_days) ASC;
    """
    lead_rows = query_all(lead_query, tuple(params))

    # Booking curve: cumulative bookings by days before departure (0 to 60)
    curve_query = f"""
    SELECT 
        b.booking_lead_days as days_before_dep,
        COUNT(t.id) as bookings_count
    FROM tickets t
    JOIN bookings b ON t.booking_id = b.id
    JOIN flights f ON t.flight_id = f.id
    {where_sql}
    AND b.booking_lead_days <= 60
    GROUP BY b.booking_lead_days
    ORDER BY days_before_dep DESC;
    """
    curve_rows = query_all(curve_query, tuple(params))

    total_bookings = sum(c["bookings_count"] for c in curve_rows)
    cumulative = 0
    booking_curve = []
    # Invert to show booking pace building up towards departure
    sorted_by_pace = sorted(curve_rows, key=lambda x: x["days_before_dep"], reverse=True)
    for c in sorted_by_pace:
        cumulative += c["bookings_count"]
        pct = round((cumulative / total_bookings * 100), 2) if total_bookings > 0 else 0
        booking_curve.append({
            "days_before_departure": c["days_before_dep"],
            "daily_bookings": c["bookings_count"],
            "cumulative_bookings": cumulative,
            "cumulative_percentage": pct
        })

    # Capacity vs Demand by Date (last 30 days)
    cap_demand_query = f"""
    SELECT 
        f.departure_date,
        SUM(f.seat_capacity) as total_capacity,
        SUM(si.booked_seats) as total_demand,
        AVG(si.load_factor) as avg_load_factor
    FROM flights f
    LEFT JOIN seat_inventory si ON f.id = si.flight_id
    WHERE f.departure_date >= ? AND f.departure_date <= ?
    {" AND f.route_code = ?" if route else ""}
    GROUP BY f.departure_date
    ORDER BY f.departure_date ASC;
    """
    cd_params = [start_date, end_date] if start_date and end_date else [
        (datetime.date.today() - datetime.timedelta(days=30)).strftime("%Y-%m-%d"),
        datetime.date.today().strftime("%Y-%m-%d")
    ]
    if route:
        cd_params.append(route.upper())

    cap_demand_rows = query_all(cap_demand_query, tuple(cd_params))

    return {
        "lead_time_distribution": lead_rows,
        "booking_curve": booking_curve,
        "capacity_vs_demand": [{
            "date": r["departure_date"],
            "seat_capacity": r["total_capacity"],
            "passenger_demand": r["total_demand"],
            "load_factor": round(r["avg_load_factor"], 2) if r["avg_load_factor"] else 0.0
        } for r in cap_demand_rows]
    }

def get_inventory_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    route: Optional[str] = None
) -> Dict[str, Any]:
    """Seat capacity utilization and alert thresholds."""
    where_sql, params = build_filter_clauses(start_date=start_date, end_date=end_date, route=route, date_field="f.departure_date")

    query = f"""
    SELECT 
        COUNT(f.id) as total_flights,
        COALESCE(SUM(f.seat_capacity), 0) as total_capacity,
        COALESCE(SUM(si.booked_seats), 0) as total_booked,
        COALESCE(SUM(si.available_seats), 0) as total_available,
        COALESCE(AVG(si.load_factor), 0.0) as avg_load_factor
    FROM flights f
    LEFT JOIN seat_inventory si ON f.id = si.flight_id
    {where_sql};
    """
    summary = query_one(query, tuple(params)) or {}

    # Critical Alerts:
    # 1. Flights approaching capacity (> 90% load factor)
    # 2. Low booking pace (< 65% load factor departing soon)
    # 3. Flights with zero or extremely low booking
    alerts_query = f"""
    SELECT 
        f.id as flight_id,
        f.flight_number,
        f.route_code,
        f.origin,
        f.destination,
        f.departure_date,
        f.departure_time,
        f.seat_capacity,
        si.booked_seats,
        si.available_seats,
        si.load_factor
    FROM flights f
    JOIN seat_inventory si ON f.id = si.flight_id
    {where_sql}
    ORDER BY f.departure_date ASC;
    """
    flights = query_all(alerts_query, tuple(params))

    high_capacity_flights = [f for f in flights if f["load_factor"] >= 90.0]
    low_load_flights = [f for f in flights if f["load_factor"] < 65.0 and f["load_factor"] > 0]

    return {
        "summary": {
            "total_flights": summary.get("total_flights", 0),
            "total_capacity": summary.get("total_capacity", 0),
            "total_booked": summary.get("total_booked", 0),
            "total_available": summary.get("total_available", 0),
            "avg_load_factor": round(summary.get("avg_load_factor", 0.0), 2)
        },
        "alerts": {
            "high_capacity_count": len(high_capacity_flights),
            "low_load_count": len(low_load_flights),
            "high_capacity_flights": high_capacity_flights[:15],
            "low_load_flights": low_load_flights[:15]
        }
    }

def get_revenue_by_airline(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    currency: str = "USD"
) -> List[Dict[str, Any]]:
    """Retrieve revenue and passenger distribution across airlines."""
    cache_key = f"rev_airline:{start_date}:{end_date}:{currency}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    where_sql, params = build_filter_clauses(
        start_date=start_date,
        end_date=end_date,
        ticket_status="Confirmed",
        date_field="t.travel_date"
    )

    query = f"""
    SELECT 
        f.airline,
        COUNT(t.id) as tickets_sold,
        SUM(t.fare_amount) as total_revenue,
        AVG(t.fare_amount) as avg_fare
    FROM tickets t
    JOIN flights f ON t.flight_id = f.id
    {where_sql}
    GROUP BY f.airline
    ORDER BY total_revenue DESC;
    """
    rows = query_all(query, tuple(params))
    curr_mult = EXCHANGE_RATE_USD_TO_INR if currency.upper() == "INR" else 1.0
    tot_rev = sum(r["total_revenue"] for r in rows) if rows else 1.0

    color_map = {
        "AeroSky Airways": "#0284c7",
        "Pacific Jet": "#2563eb",
        "Atlantic Global": "#0d9488",
        "Northern Express": "#7c3aed"
    }

    result = [{
        "airline": r["airline"],
        "tickets_sold": r["tickets_sold"],
        "total_revenue": round(r["total_revenue"] * curr_mult, 2),
        "avg_fare": round(r["avg_fare"] * curr_mult, 2),
        "percentage": round(r["total_revenue"] / tot_rev * 100, 2),
        "color": color_map.get(r["airline"], "#3b82f6")
    } for r in rows]

    cache.set(cache_key, result, ttl=60)
    return result

def get_revenue_by_channel(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    currency: str = "USD"
) -> List[Dict[str, Any]]:
    """Retrieve ticket sales distribution by sales channel."""
    cache_key = f"rev_channel:{start_date}:{end_date}:{currency}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    where_sql, params = build_filter_clauses(
        start_date=start_date,
        end_date=end_date,
        ticket_status="Confirmed",
        date_field="t.travel_date"
    )

    query = f"""
    SELECT 
        b.sales_channel,
        COUNT(t.id) as tickets_sold,
        SUM(t.fare_amount) as total_revenue,
        AVG(t.fare_amount) as avg_fare
    FROM tickets t
    JOIN bookings b ON t.booking_id = b.id
    {where_sql}
    GROUP BY b.sales_channel
    ORDER BY total_revenue DESC;
    """
    rows = query_all(query, tuple(params))
    curr_mult = EXCHANGE_RATE_USD_TO_INR if currency.upper() == "INR" else 1.0
    tot_rev = sum(r["total_revenue"] for r in rows) if rows else 1.0

    color_map = {
        "Direct Website": "#0284c7",
        "Mobile App": "#10b981",
        "OTA": "#f59e0b",
        "Travel Agent": "#8b5cf6",
        "Corporate Portal": "#ec4899"
    }

    result = [{
        "channel": r["sales_channel"],
        "tickets_sold": r["tickets_sold"],
        "total_revenue": round(r["total_revenue"] * curr_mult, 2),
        "avg_fare": round(r["avg_fare"] * curr_mult, 2),
        "percentage": round(r["total_revenue"] / tot_rev * 100, 2),
        "color": color_map.get(r["sales_channel"], "#6366f1")
    } for r in rows]

    cache.set(cache_key, result, ttl=60)
    return result

