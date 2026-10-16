from typing import Dict, Any, List, Optional
from backend.app.services.data_service import (
    get_kpi_summary, get_revenue_by_route, get_revenue_by_class,
    get_revenue_by_travel_period, get_inventory_summary
)

def generate_business_insights(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    currency: str = "USD"
) -> List[Dict[str, Any]]:
    """
    Generate dynamic, data-driven business insights from the filtered operational data.
    """
    insights = []
    curr_symbol = "₹" if currency.upper() == "INR" else "$"

    # 1. KPI and revenue growth insight
    summary = get_kpi_summary(start_date=start_date, end_date=end_date, currency=currency)
    rev_metric = summary["metrics"]["total_revenue"]
    rev_change = rev_metric.get("change_pct")

    if rev_change is not None:
        if rev_change > 0:
            insights.append({
                "id": "rev_growth",
                "category": "Revenue Performance",
                "type": "positive",
                "title": f"Revenue Expanded by +{rev_change:.1f}%",
                "supporting_metric": f"{curr_symbol}{rev_metric['value']:,.2f} (Prev: {curr_symbol}{rev_metric['prior_value']:,.2f})",
                "comparison_period": f"vs {summary['prior_range']['start']} to {summary['prior_range']['end']}",
                "explanation": f"Total ticket revenue increased by {rev_change:.1f}% over the prior period driven by steady yields and robust load factors.",
                "recommended_action": "Maintain current commercial inventory allocations and monitor booking pace for upcoming holiday flights."
            })
        else:
            insights.append({
                "id": "rev_decline",
                "category": "Revenue Performance",
                "type": "warning",
                "title": f"Revenue Softened by {rev_change:.1f}%",
                "supporting_metric": f"{curr_symbol}{rev_metric['value']:,.2f} (Prev: {curr_symbol}{rev_metric['prior_value']:,.2f})",
                "comparison_period": f"vs {summary['prior_range']['start']} to {summary['prior_range']['end']}",
                "explanation": "Revenue pace decreased slightly compared to the preceding equivalent period, primarily driven by travel seasonality transitions.",
                "recommended_action": "Evaluate targeted promotional fares on lower-performing weekday departures to stimulate booking volume."
            })

    # 2. Top-performing route insight
    routes = get_revenue_by_route(start_date=start_date, end_date=end_date, currency=currency)
    if routes:
        top_route = routes[0]
        insights.append({
            "id": "top_route",
            "category": "Route Strategy",
            "type": "positive",
            "title": f"Top Revenue Generator: Route {top_route['route_code']}",
            "supporting_metric": f"{curr_symbol}{top_route['total_revenue']:,.2f} ({top_route['tickets_sold']:,} tickets)",
            "comparison_period": "Selected Period",
            "explanation": f"Route {top_route['route_code']} ({top_route['origin']} → {top_route['destination']}) generated the highest passenger revenue with an average load factor of {top_route['load_factor']}%.",
            "recommended_action": "Assess viability of deploying higher-capacity aircraft (e.g. wide-body) or adding frequency during peak departure banks."
        })

    # 3. Lowest load factor route / underperforming capacity
    if len(routes) > 1:
        low_lf_route = min(routes, key=lambda x: x["load_factor"])
        if low_lf_route["load_factor"] < 75.0:
            insights.append({
                "id": "low_utilization_route",
                "category": "Capacity Utilization",
                "type": "warning",
                "title": f"Capacity Underutilization on {low_lf_route['route_code']}",
                "supporting_metric": f"Load Factor: {low_lf_route['load_factor']}% (Capacity: {low_lf_route['seat_capacity']:,})",
                "comparison_period": "Selected Period",
                "explanation": f"Route {low_lf_route['route_code']} has a load factor of {low_lf_route['load_factor']}%, leaving substantial seat inventory unsold.",
                "recommended_action": "Test dynamic pricing elasticity through the Fare Optimization simulator and explore channel-specific promotional allocations."
            })

    # 4. Premium cabin yield insight
    classes = get_revenue_by_class(start_date=start_date, end_date=end_date, currency=currency)
    biz_class = next((c for c in classes["classes"] if c["booking_class"] == "Business"), None)
    if biz_class:
        insights.append({
            "id": "premium_cabin_yield",
            "category": "Cabin Mix",
            "type": "neutral",
            "title": f"Business Class Contributes {biz_class['percentage']}% of Total Revenue",
            "supporting_metric": f"{curr_symbol}{biz_class['total_revenue']:,.2f} @ {curr_symbol}{biz_class['avg_fare']:,.2f} avg fare",
            "comparison_period": "Selected Period",
            "explanation": f"High premium yield: Business class represents {biz_class['tickets_sold']:,} tickets ({round(biz_class['tickets_sold']/classes['total_tickets']*100, 1)}% of volume) while generating {biz_class['percentage']}% of total revenue.",
            "recommended_action": "Protect premium inventory from premature dilution and offer corporate loyalty upgrades closer to departure."
        })

    # 5. Day-of-week demand pattern
    period_data = get_revenue_by_travel_period(start_date=start_date, end_date=end_date, currency=currency)
    dow = period_data.get("day_of_week", [])
    if dow:
        peak_day = max(dow, key=lambda x: x["revenue"])
        insights.append({
            "id": "dow_peak",
            "category": "Temporal Pacing",
            "type": "neutral",
            "title": f"{peak_day['day_name']} is the Peak Revenue Day",
            "supporting_metric": f"{curr_symbol}{peak_day['revenue']:,.2f} ({peak_day['tickets']:,} tickets)",
            "comparison_period": "Day of Week Aggregate",
            "explanation": f"{peak_day['day_name']} experiences the highest concentration of bookings and business passenger travel across the network.",
            "recommended_action": "Apply tighter discount controls and yield up fares on {peak_day['day_name']} departures."
        })

    # 6. Inventory alerts insight
    inventory = get_inventory_summary(start_date=start_date, end_date=end_date)
    high_cap_count = inventory["alerts"]["high_capacity_count"]
    if high_cap_count > 0:
        insights.append({
            "id": "inventory_saturation",
            "category": "Seat Inventory",
            "type": "action",
            "title": f"{high_cap_count} Flights Approaching 90%+ Capacity",
            "supporting_metric": f"{high_cap_count} flights in critical inventory tier",
            "comparison_period": "Upcoming Departures",
            "explanation": "Multiple flights have sold over 90% of available seats with strong booking momentum remaining.",
            "recommended_action": "Close lower booking classes (Y, B, M) immediately and allow only high-yield fare buckets to maximize flight revenue."
        })

    return insights
