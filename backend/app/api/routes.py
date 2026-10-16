from fastapi import APIRouter, Query
from typing import Optional, List
from backend.app.services.data_service import get_revenue_by_route

router = APIRouter(prefix="/api/routes", tags=["Route Performance"])

@router.get("/performance")
async def get_route_performance(
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

@router.get("/comparison")
async def compare_routes(
    routes: str = Query(..., description="Comma-separated route codes, e.g. DEL-BOM,BOM-BLR"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    currency: str = Query("USD")
):
    selected_codes = [r.strip().upper() for r in routes.split(",") if r.strip()]
    all_routes = get_revenue_by_route(start_date=start_date, end_date=end_date, currency=currency)
    filtered = [r for r in all_routes if r["route_code"] in selected_codes]
    return {
        "currency": currency.upper(),
        "selected_routes": selected_codes,
        "comparison": filtered
    }
