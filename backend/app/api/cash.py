from fastapi import APIRouter, Query
from typing import Dict, Any
from app.services.state_store import system_state
from app.services.cash_engine import CashEngine

router = APIRouter(prefix="/cash", tags=["Cash Intelligence & Forecasting"])

@router.get("/current")
async def get_current_cash_position():
    return system_state.cash_position_data

@router.get("/forecast")
async def get_cash_forecast(horizon_days: int = Query(7, ge=1, le=30)):
    forecast = CashEngine.generate_cash_forecast(
        cash_position=system_state.cash_position_data,
        horizon_days=horizon_days
    )
    return forecast
