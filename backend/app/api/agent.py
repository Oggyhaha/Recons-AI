from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.services.state_store import system_state
from app.models.schemas import CopilotQueryRequest, CopilotQueryResponse

router = APIRouter(prefix="/agent", tags=["AI Agent & Copilot"])

@router.post("/investigate/{transaction_id}")
async def run_ai_investigation(transaction_id: str):
    excs = system_state.exceptions_list
    found = next((e for e in excs if e.get("transaction_id") == transaction_id), None)
    if not found:
        raise HTTPException(status_code=404, detail="Exception not found.")

    investigation = system_state.agent_service.investigate_exception(found)
    system_state.agent_investigation_runs[investigation["run_id"]] = investigation
    return investigation

@router.get("/runs/{run_id}")
async def get_agent_run(run_id: str):
    found = system_state.agent_investigation_runs.get(run_id)
    if not found:
        raise HTTPException(status_code=404, detail="Agent run not found.")
    return found

@router.post("/ask", response_model=CopilotQueryResponse)
async def ask_finance_copilot(req: CopilotQueryRequest):
    summary = system_state.reconciliation_data.get("summary", {})
    context = {
        "cash_position": system_state.cash_position_data,
        "exceptions_count": len(system_state.exceptions_list),
        "exceptions": system_state.exceptions_list,
        "clusters": system_state.clusters_list,
        "orders": system_state.current_batch.get("orders", []),
        "payments": system_state.current_batch.get("payments", []),
        "settlements": system_state.current_batch.get("settlements", []),
        "bank_transactions": system_state.current_batch.get("bank_transactions", []),
        "total_records": summary.get("total_records", 500),
        "matched_records": summary.get("matched_count", 446),
        "match_rate": summary.get("match_rate", 89.56),
        "reconciliation_summary": summary
    }
    response = await system_state.agent_service.answer_finance_query(req.query, context)
    return CopilotQueryResponse(**response)
