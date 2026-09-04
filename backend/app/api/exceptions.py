from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.services.state_store import system_state
from app.models.schemas import HumanApprovalRequest
from app.services.audit_service import audit_service
from app.services.cash_engine import CashEngine

router = APIRouter(prefix="/exceptions", tags=["Exception Management & Case Room"])

@router.get("")
async def get_exceptions(
    severity: Optional[str] = Query(None, description="Filter: CRITICAL, HIGH, MEDIUM, LOW"),
    status: Optional[str] = Query(None, description="Filter: OPEN, WAITING_HUMAN, RESOLVED, REJECTED"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    excs = system_state.exceptions_list
    if severity:
        excs = [e for e in excs if e.get("severity") == severity]
    if status:
        excs = [e for e in excs if e.get("status") == status]

    total = len(excs)
    paginated = excs[offset : offset + limit]

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "items": paginated
    }

@router.get("/clusters")
async def get_exception_clusters():
    return {
        "clusters": system_state.clusters_list
    }

@router.get("/{transaction_id}")
async def get_exception_detail(transaction_id: str):
    excs = system_state.exceptions_list
    found = next((e for e in excs if e.get("transaction_id") == transaction_id), None)
    if not found:
        raise HTTPException(status_code=404, detail="Exception not found.")

    # Retrieve related lifecycle nodes
    matched_ids = found.get("matched_record_ids", [])
    order_id = transaction_id if "ORD" in transaction_id else matched_ids[0] if matched_ids else transaction_id
    
    orders = [o for o in system_state.current_batch.get("orders", []) if o.get("order_id") == order_id]
    payments = [p for p in system_state.current_batch.get("payments", []) if p.get("order_id") == order_id]
    settle_id = payments[0].get("settlement_id") if payments else None
    settlements = [s for s in system_state.current_batch.get("settlements", []) if s.get("settlement_id") == settle_id]
    utr = settlements[0].get("utr") if settlements else None
    banks = [b for b in system_state.current_batch.get("bank_transactions", []) if b.get("bank_reference") == utr]
    refunds = [r for r in system_state.current_batch.get("refunds", []) if payments and r.get("payment_id") == payments[0].get("payment_id")]

    # Attach evidence package
    evidence = [
        {
            "type": "TRANSACTION_FACT",
            "source": "Orders & Payments",
            "description": f"Target entity {transaction_id} with financial exposure of ₹{found.get('financial_exposure_minor', 0) / 100:,.2f}."
        },
        {
            "type": "REASON_CODE",
            "source": "Reconciliation Engine",
            "description": f"Root cause flagged as {found.get('root_cause')}."
        },
        {
            "type": "POLICY_RULE",
            "source": "Razorpay Standard Settlement Rules v1.0",
            "description": "Any discrepancy exceeding ₹2.00 threshold triggers mandatory variance accounting."
        }
    ]

    return {
        "exception": found,
        "evidence": evidence,
        "lifecycle": {
            "order": orders[0] if orders else None,
            "payment": payments[0] if payments else None,
            "settlement": settlements[0] if settlements else None,
            "bank": banks[0] if banks else None,
            "refund": refunds[0] if refunds else None
        }
    }

@router.post("/{transaction_id}/review")
async def review_exception(transaction_id: str, req: HumanApprovalRequest):
    excs = system_state.exceptions_list
    found = next((e for e in excs if e.get("transaction_id") == transaction_id), None)
    if not found:
        raise HTTPException(status_code=404, detail="Exception not found.")

    old_status = found.get("status", "OPEN")
    new_status = "RESOLVED" if req.action == "APPROVE" else "REJECTED" if req.action == "REJECT" else "INVESTIGATING"
    
    found["status"] = new_status
    found["resolved_by"] = req.actor_id
    found["resolution_notes"] = req.notes or f"Action {req.action} taken by {req.actor_id}"
    found["resolved_at"] = datetime.now(timezone.utc).isoformat()

    # Immutable Audit Log Entry
    audit_service.record_event(
        actor_type="USER",
        actor_id=req.actor_id,
        action=f"EXCEPTION_{req.action}",
        entity_type="EXCEPTION",
        entity_id=transaction_id,
        before_state={"status": old_status},
        after_state={"status": new_status, "notes": req.notes},
        reason=req.notes or f"Human review decision executed by controller."
    )

    # Recalculate Cash Position to reflect resolved exposure
    system_state.cash_position_data = CashEngine.calculate_cash_position(
        bank_transactions=system_state.current_batch["bank_transactions"],
        settlements=system_state.current_batch["settlements"],
        refunds=system_state.current_batch["refunds"],
        exceptions=system_state.exceptions_list
    )

    return {
        "status": "success",
        "message": f"Exception {transaction_id} updated to {new_status}.",
        "exception": found,
        "updated_cash_position": system_state.cash_position_data
    }
