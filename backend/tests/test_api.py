import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_dashboard_summary_api():
    response = client.get("/api/dashboard/summary?currency=USD")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "total_revenue" in data["metrics"]
    assert data["metrics"]["total_revenue"]["value"] > 0

def test_dashboard_insights_api():
    response = client.get("/api/dashboard/insights?currency=USD")
    assert response.status_code == 200
    insights = response.json()
    assert isinstance(insights, list)
    assert len(insights) > 0
    assert "title" in insights[0]
    assert "recommended_action" in insights[0]

def test_filter_options_api():
    response = client.get("/api/dashboard/filter-options")
    assert response.status_code == 200
    opts = response.json()
    assert "airports" in opts
    assert "routes" in opts
    assert len(opts["airports"]) > 0

def test_revenue_trends_api():
    response = client.get("/api/revenue/trends?interval=daily&metric=revenue")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert len(data["data"]) > 0

def test_revenue_by_route_api():
    response = client.get("/api/revenue/by-route?sort_by=revenue")
    assert response.status_code == 200
    routes = response.json()
    assert isinstance(routes, list)
    assert len(routes) > 0

def test_tickets_api():
    response = client.get("/api/tickets?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "tickets" in data
    assert len(data["tickets"]) <= 10

def test_route_comparison_api():
    response = client.get("/api/routes/comparison?routes=DEL-BOM,BOM-BLR")
    assert response.status_code == 200
    data = response.json()
    assert "comparison" in data
    assert len(data["comparison"]) == 2

def test_fare_simulation_api():
    payload = {
        "route_code": "DEL-BOM",
        "fare_change_pct": 10.0,
        "elasticity": -1.15,
        "currency": "USD"
    }
    response = client.post("/api/fare-optimization/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "simulation" in data
    assert "revenue_delta" in data["simulation"]

def test_revenue_forecast_api():
    response = client.get("/api/forecast/revenue?horizon_days=30&metric=revenue")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert len(data["forecast"]) == 30

def test_reports_export_api():
    response = client.get("/api/reports/export?report_type=revenue_summary&format=csv")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert b"Total Revenue" in response.content

def test_settings_api():
    response = client.get("/api/settings")
    assert response.status_code == 200
    data = response.json()
    assert "settings" in data
    assert "currency" in data["settings"]
