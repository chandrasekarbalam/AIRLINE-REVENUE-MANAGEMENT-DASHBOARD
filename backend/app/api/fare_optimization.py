from fastapi import APIRouter, Query, Body
from pydantic import BaseModel, Field
from typing import Optional
from backend.app.services.fare_simulator import get_fare_recommendations, simulate_what_if_fare

router = APIRouter(prefix="/api/fare-optimization", tags=["Fare Optimization"])

class FareSimulateRequest(BaseModel):
    route_code: str = Field(..., example="DEL-BOM")
    fare_change_pct: float = Field(..., example=10.0)
    elasticity: float = Field(-1.15, example=-1.15)
    capacity_override: Optional[int] = Field(None)
    currency: str = Field("USD")

@router.get("/recommendations")
async def get_recommendations(currency: str = Query("USD")):
    return get_fare_recommendations(currency=currency)

@router.post("/simulate")
async def simulate_fare(req: FareSimulateRequest):
    return simulate_what_if_fare(
        route_code=req.route_code,
        fare_change_pct=req.fare_change_pct,
        elasticity=req.elasticity,
        capacity_override=req.capacity_override,
        currency=req.currency
    )
