from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any, List, Optional
from app.services.state_store import system_state
from app.models.schemas import ReconciliationRunRequest

router = APIRouter(prefix="/reconciliation", tags=["Reconciliation Core"])

@router.get("/runs/latest")
async def get_latest_run():
    recon = system_state.reconciliation_data
    summary = recon.get("summary", {})
    return {
        "run_id": "RUN-RZP-2026-001",
        "rule_version": "v1.0-razorpay-standard",
        "engine_version": "1.0.0-production",
        "status": "COMPLETED",
        "total_records": summary.get("total_records", 0),
        "matched_count": summary.get("matched_count", 0),
        "exception_count": summary.get("exception_count", 0),
        "unresolved_count": summary.get("unresolved_count", 0),
        "match_rate": summary.get("match_rate", 0.0),
        "duration_sec": summary.get("duration_sec", 0.0),
        "throughput_rps": summary.get("throughput_rps", 0.0)
    }

@router.post("/runs")
async def execute_reconciliation(req: ReconciliationRunRequest):
    # Re-run reconciliation on active batch
    batch = system_state.current_batch
    recon_res = system_state.recon_engine.reconcile_batch(
        orders=batch["orders"],
        payments=batch["payments"],
        settlements=batch["settlements"],
        bank_transactions=batch["bank_transactions"],
        refunds=batch["refunds"],
        adjustments=batch["adjustments"]
    )
    system_state.reconciliation_data = recon_res
    system_state.exceptions_list = list(recon_res["exceptions"])
    return {
        "status": "COMPLETED",
        "run_id": "RUN-RZP-2026-MANUAL",
        "summary": recon_res["summary"]
    }

@router.get("/results")
async def get_reconciliation_results(
    decision: Optional[str] = Query(None, description="Filter by decision: MATCHED, PARTIAL_SETTLEMENT, etc."),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    results = system_state.reconciliation_data.get("results", [])
    if decision:
        results = [r for r in results if r.get("decision") == decision]

    total_count = len(results)
    paginated = results[offset : offset + limit]

    return {
        "total": total_count,
        "offset": offset,
        "limit": limit,
        "items": paginated
    }

@router.get("/results/{entity_id}")
async def get_result_detail(entity_id: str):
    results = system_state.reconciliation_data.get("results", [])
    found = next((r for r in results if r.get("entity_id") == entity_id), None)
    if not found:
        raise HTTPException(status_code=404, detail="Entity not found in current reconciliation run.")

    # Synthesize lifecycle graph nodes and edges
    matched_ids = found.get("matched_record_ids", [])
    order_id = entity_id if "ORD" in entity_id else matched_ids[0] if matched_ids else entity_id
    
    # Retrieve related raw objects
    orders = [o for o in system_state.current_batch.get("orders", []) if o.get("order_id") == order_id]
    payments = [p for p in system_state.current_batch.get("payments", []) if p.get("order_id") == order_id]
    
    settle_id = payments[0].get("settlement_id") if payments else None
    settlements = [s for s in system_state.current_batch.get("settlements", []) if s.get("settlement_id") == settle_id]
    
    utr = settlements[0].get("utr") if settlements else None
    banks = [b for b in system_state.current_batch.get("bank_transactions", []) if b.get("bank_reference") == utr]
    
    refunds = [r for r in system_state.current_batch.get("refunds", []) if payments and r.get("payment_id") == payments[0].get("payment_id")]

    lifecycle_graph = {
        "order": orders[0] if orders else None,
        "payment": payments[0] if payments else None,
        "settlement": settlements[0] if settlements else None,
        "bank": banks[0] if banks else None,
        "refund": refunds[0] if refunds else None
    }

    return {
        "result": found,
        "lifecycle_graph": lifecycle_graph
    }
