from fastapi import APIRouter, Query
from typing import Optional
from backend.app.services.forecasting_service import run_revenue_forecast

router = APIRouter(prefix="/api/forecast", tags=["Revenue Forecasting"])

@router.get("/revenue")
async def get_forecast(
    horizon_days: int = Query(30, ge=7, le=90),
    metric: str = Query("revenue"),
    route: Optional[str] = Query(None),
    currency: str = Query("USD")
):
    return run_revenue_forecast(
        horizon_days=horizon_days,
        metric=metric,
        route=route,
        currency=currency
    )
