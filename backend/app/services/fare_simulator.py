from typing import Dict, Any, List, Optional
from backend.app.database.connection import query_all

EXCHANGE_RATE_USD_TO_INR = 85.0

def get_fare_recommendations(currency: str = "USD") -> List[Dict[str, Any]]:
    """
    Generate decision-support fare recommendations based on route demand, 
    seat availability, and load factors.
    """
    query = """
    SELECT 
        f.route_code,
        f.origin,
        f.destination,
        COUNT(DISTINCT f.id) as flight_count,
        SUM(f.seat_capacity) as total_capacity,
        SUM(si.booked_seats) as booked_seats,
        AVG(si.load_factor) as avg_load_factor,
        AVG(t.fare_amount) as current_avg_fare
    FROM flights f
    JOIN seat_inventory si ON f.id = si.flight_id
    JOIN tickets t ON t.flight_id = f.id
    WHERE t.ticket_status = 'Confirmed'
    GROUP BY f.route_code, f.origin, f.destination
    ORDER BY avg_load_factor DESC;
    """
    routes = query_all(query)
    mult = EXCHANGE_RATE_USD_TO_INR if currency.upper() == "INR" else 1.0

    recommendations = []
    for r in routes:
        lf = r["avg_load_factor"]
        avg_fare = round(r["current_avg_fare"] * mult, 2)
        code = r["route_code"]

        if lf >= 88.0:
            rec_action = "Increase fare consideration"
            rec_range = "+5% to +12%"
            impact = "Potential revenue yield expansion by capturing willingness-to-pay on high-demand departures."
            confidence = "High (88%)"
            explanation = f"Route {code} operates with an exceptionally high load factor of {lf:.1f}%. High passenger spillover suggests strong demand elasticity headroom."
            tag = "increase"
        elif lf < 70.0:
            rec_action = "Review promotional pricing"
            rec_range = "-6% to -15%"
            impact = "Simulate demand stimulation to fill empty seats without triggering destructive price wars."
            confidence = "Moderate (74%)"
            explanation = f"Route {code} has lower capacity utilization ({lf:.1f}%). Dynamic discounts or targeted promotional campaigns could capture incremental leisure demand."
            tag = "decrease"
        else:
            rec_action = "Maintain current fare"
            rec_range = "-2% to +3%"
            impact = "Stable revenue pacing and consistent load factor equilibrium."
            confidence = "High (91%)"
            explanation = f"Route {code} operates near optimal target load factor ({lf:.1f}%). Current pricing aligns well with market demand."
            tag = "maintain"

        recommendations.append({
            "route_code": code,
            "origin": r["origin"],
            "destination": r["destination"],
            "current_avg_fare": avg_fare,
            "currency": currency.upper(),
            "load_factor": round(lf, 1),
            "seat_capacity": r["total_capacity"],
            "booked_seats": r["booked_seats"],
            "recommendation": rec_action,
            "suggested_adjustment": rec_range,
            "tag": tag,
            "expected_impact": impact,
            "confidence": confidence,
            "explanation": explanation
        })

    return recommendations

def simulate_what_if_fare(
    route_code: str,
    fare_change_pct: float,        # e.g. +10% or -15%
    elasticity: float = -1.15,      # Price Elasticity of Demand (Ed = %ΔQ / %ΔP)
    capacity_override: Optional[int] = None,
    currency: str = "USD"
) -> Dict[str, Any]:
    """
    Simulate what-if pricing adjustments using price elasticity and physical capacity constraints:
    ΔQ/Q = Ed * (ΔP/P)
    """
    query = """
    SELECT 
        f.route_code,
        SUM(f.seat_capacity) as total_capacity,
        SUM(si.booked_seats) as baseline_tickets,
        AVG(t.fare_amount) as baseline_fare,
        SUM(t.fare_amount) as baseline_revenue
    FROM flights f
    JOIN seat_inventory si ON f.id = si.flight_id
    JOIN tickets t ON t.flight_id = f.id
    WHERE f.route_code = ? AND t.ticket_status = 'Confirmed'
    GROUP BY f.route_code;
    """
    data = query_all(query, (route_code.upper(),))
    if not data:
        # Fallback to general route metrics
        data = query_all("""
        SELECT 
            'ALL' as route_code,
            SUM(f.seat_capacity) as total_capacity,
            SUM(si.booked_seats) as baseline_tickets,
            AVG(t.fare_amount) as baseline_fare,
            SUM(t.fare_amount) as baseline_revenue
        FROM flights f
        JOIN seat_inventory si ON f.id = si.flight_id
        JOIN tickets t ON t.flight_id = f.id
        WHERE t.ticket_status = 'Confirmed';
        """)

    rec = data[0]
    mult = EXCHANGE_RATE_USD_TO_INR if currency.upper() == "INR" else 1.0

    capacity = capacity_override if capacity_override else rec["total_capacity"]
    base_tix = rec["baseline_tickets"]
    base_fare = rec["baseline_fare"] * mult
    base_rev = base_tix * base_fare
    base_lf = (base_tix / capacity * 100) if capacity > 0 else 0.0

    # Pricing adjustment
    p_change_ratio = fare_change_pct / 100.0
    hypothetical_fare = base_fare * (1.0 + p_change_ratio)

    # Demand response: %ΔQ = Ed * %ΔP
    q_change_ratio = elasticity * p_change_ratio
    raw_hypothetical_demand = base_tix * (1.0 + q_change_ratio)

    # Physical seat capacity constraint: cannot sell more than total available capacity
    constrained_hypothetical_tickets = min(capacity, max(0, int(raw_hypothetical_demand)))
    hypothetical_revenue = constrained_hypothetical_tickets * hypothetical_fare
    hypothetical_lf = (constrained_hypothetical_tickets / capacity * 100) if capacity > 0 else 0.0

    revenue_delta = hypothetical_revenue - base_rev
    revenue_delta_pct = (revenue_delta / base_rev * 100) if base_rev > 0 else 0.0
    tickets_delta = constrained_hypothetical_tickets - base_tix
    spillover_passengers = max(0, int(raw_hypothetical_demand - capacity))

    # Sensitivity curve across -30% to +40% fare changes
    sensitivity_curve = []
    for step in range(-30, 45, 5):
        s_p_ratio = step / 100.0
        s_fare = base_fare * (1.0 + s_p_ratio)
        s_demand = min(capacity, max(0, int(base_tix * (1.0 + elasticity * s_p_ratio))))
        s_rev = s_demand * s_fare
        sensitivity_curve.append({
            "fare_change_pct": step,
            "projected_fare": round(s_fare, 2),
            "projected_demand": s_demand,
            "projected_revenue": round(s_rev, 2),
            "projected_load_factor": round((s_demand / capacity * 100), 1) if capacity > 0 else 0.0
        })

    return {
        "route_code": route_code.upper(),
        "currency": currency.upper(),
        "elasticity_assumption": elasticity,
        "capacity_constraint": capacity,
        "fare_change_pct": fare_change_pct,
        "baseline": {
            "average_fare": round(base_fare, 2),
            "tickets_sold": base_tix,
            "total_revenue": round(base_rev, 2),
            "load_factor": round(base_lf, 2)
        },
        "simulation": {
            "average_fare": round(hypothetical_fare, 2),
            "tickets_sold": constrained_hypothetical_tickets,
            "unconstrained_demand": int(raw_hypothetical_demand),
            "spillover_passengers": spillover_passengers,
            "total_revenue": round(hypothetical_revenue, 2),
            "load_factor": round(hypothetical_lf, 2),
            "revenue_delta": round(revenue_delta, 2),
            "revenue_delta_pct": round(revenue_delta_pct, 2),
            "tickets_delta": tickets_delta
        },
        "sensitivity_curve": sensitivity_curve,
        "disclaimer": "Simulated outcomes are decision-support projections derived from price elasticity of demand models and seat inventory constraints. Real market responses may vary based on competitor actions, seasonality, and macro factors."
    }
