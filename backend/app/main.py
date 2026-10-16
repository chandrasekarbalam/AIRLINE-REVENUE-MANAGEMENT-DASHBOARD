import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.database.init_db import init_all
from backend.app.api import (
    auth, admin, dashboard, revenue, tickets, routes, 
    flights, demand, inventory, fare_optimization, 
    forecast, upload, reports, settings
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist on startup
    init_all()
    yield

app = FastAPI(
    title="Airline Revenue Management Dashboard API",
    description="Enterprise-grade airline revenue analytics, demand forecasting, fare optimization and capacity management APIs.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(dashboard.router)
app.include_router(revenue.router)
app.include_router(tickets.router)
app.include_router(routes.router)
app.include_router(flights.router)
app.include_router(demand.router)
app.include_router(inventory.router)
app.include_router(fare_optimization.router)
app.include_router(forecast.router)
app.include_router(upload.router)
app.include_router(reports.router)
app.include_router(settings.router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Airline Revenue Management System",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
