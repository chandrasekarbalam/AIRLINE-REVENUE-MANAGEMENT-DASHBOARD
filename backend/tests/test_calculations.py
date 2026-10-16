import pytest
from backend.app.services.data_service import (
    get_kpi_summary, get_revenue_by_route, get_revenue_by_class,
    get_ticket_transactions, convert_currency
)
from backend.app.services.forecasting_service import run_revenue_forecast
from backend.app.services.fare_simulator import simulate_what_if_fare, get_fare_recommendations
from backend.app.services.export_service import generate_report_export

def test_currency_conversion():
    assert convert_currency(100.0, "USD") == 100.0
    assert convert_currency(100.0, "INR") == 8500.0

def test_kpi_summary():
    summary = get_kpi_summary(currency="USD")
    assert "metrics" in summary
    metrics = summary["metrics"]
    assert "total_revenue" in metrics
    assert "tickets_sold" in metrics
    assert "load_factor" in metrics
    assert "average_fare" in metrics
    assert "rask" in metrics
    assert "yield" in metrics

    # Verify calculation consistency: avg_fare = total_revenue / tickets_sold
    rev = metrics["total_revenue"]["value"]
    sold = metrics["tickets_sold"]["value"]
    avg_f = metrics["average_fare"]["value"]

    if sold > 0:
        calc_avg = round(rev / sold, 2)
        assert abs(calc_avg - avg_f) <= 0.05

def test_load_factor_bounds():
    summary = get_kpi_summary()
    lf = summary["metrics"]["load_factor"]["value"]
    assert 0.0 <= lf <= 100.0

def test_route_performance_aggregation():
    routes = get_revenue_by_route(currency="USD")
    assert len(routes) > 0
    first_route = routes[0]
    assert "route_code" in first_route
    assert "total_revenue" in first_route
    assert "load_factor" in first_route
    assert first_route["total_revenue"] >= 0

def test_class_breakdown_percentages():
    classes = get_revenue_by_class(currency="USD")
    assert "classes" in classes
    assert len(classes["classes"]) > 0
    total_pct = sum(c["percentage"] for c in classes["classes"])
    assert 99.0 <= total_pct <= 101.0  # Around 100% with rounding

def test_forecasting_pipeline():
    fc = run_revenue_forecast(horizon_days=30, metric="revenue", currency="USD")
    assert fc["status"] == "success"
    assert len(fc["forecast"]) == 30
    assert "performance_metrics" in fc
    assert fc["performance_metrics"]["mae"] is not None
    assert fc["performance_metrics"]["rmse"] is not None

    # Check prediction intervals: lower_bound <= forecast_value <= upper_bound
    for pt in fc["forecast"]:
        assert pt["lower_bound"] <= pt["forecast_value"] <= pt["upper_bound"]

def test_fare_simulator_elasticity():
    # Price increase should decrease demand if elasticity < 0
    res_plus = simulate_what_if_fare("DEL-BOM", fare_change_pct=10.0, elasticity=-1.2)
    assert res_plus["simulation"]["tickets_sold"] <= res_plus["baseline"]["tickets_sold"]

    # Price decrease should increase demand up to capacity
    res_minus = simulate_what_if_fare("DEL-BOM", fare_change_pct=-10.0, elasticity=-1.2)
    assert res_minus["simulation"]["tickets_sold"] >= res_minus["baseline"]["tickets_sold"]

def test_fare_recommendations():
    recs = get_fare_recommendations()
    assert len(recs) > 0
    for r in recs:
        assert r["recommendation"] in ["Increase fare consideration", "Maintain current fare", "Review promotional pricing"]

def test_export_reports():
    # Test CSV export
    csv_bytes, filename, mime = generate_report_export("revenue_summary", export_format="csv")
    assert len(csv_bytes) > 0
    assert filename.endswith(".csv")
    assert mime == "text/csv"

    # Test Excel export
    excel_bytes, ex_filename, ex_mime = generate_report_export("revenue_summary", export_format="excel")
    assert len(excel_bytes) > 0
    assert ex_filename.endswith(".xlsx")
