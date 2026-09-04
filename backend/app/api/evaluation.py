from fastapi import APIRouter
from typing import Dict, Any
from app.services.state_store import system_state
from app.models.schemas import EvaluationReportOut

router = APIRouter(prefix="/evaluation", tags=["Evaluation & Ground Truth Benchmark"])

@router.get("/report", response_model=EvaluationReportOut)
async def get_evaluation_report():
    """
    Returns non-cherry-picked evaluation report measured against hidden ground truth per PRD §50, §94-95.
    """
    return EvaluationReportOut(**system_state.evaluation_report_data)
