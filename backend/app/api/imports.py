from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Dict, Any, List
from app.services.state_store import system_state
from app.models.schemas import FinSimGenerateRequest

router = APIRouter(prefix="/imports", tags=["Imports & Data Ingestion"])

@router.get("/status")
async def get_import_status():
    batch = system_state.current_batch
    metadata = batch.get("metadata", {})
    return {
        "dataset_name": "FinSim Production Multi-Source Batch",
        "records_count": metadata.get("records_count", 0),
        "clean_count": metadata.get("clean_count", 0),
        "anomaly_count": metadata.get("anomaly_count", 0),
        "anomaly_rate": metadata.get("anomaly_rate", 0.0),
        "sources": [
            {"source_type": "ORDERS_COMMERCE", "rows": len(batch.get("orders", [])), "status": "VALIDATED"},
            {"source_type": "PAYMENT_GATEWAY", "rows": len(batch.get("payments", [])), "status": "VALIDATED"},
            {"source_type": "SETTLEMENT_SYSTEM", "rows": len(batch.get("settlements", [])), "status": "VALIDATED"},
            {"source_type": "BANK_STATEMENT", "rows": len(batch.get("bank_transactions", [])), "status": "VALIDATED"},
            {"source_type": "REFUNDS_ENGINE", "rows": len(batch.get("refunds", [])), "status": "VALIDATED"}
        ]
    }

@router.post("/generate-batch")
async def generate_finsim_batch(req: FinSimGenerateRequest):
    """
    Triggers deterministic FinSim generation and runs full reconciliation loop.
    Supports 50 to 50,000 records with realistic Razorpay lifecycle.
    """
    result = system_state.generate_and_reconcile(
        record_count=req.records_count,
        anomaly_rate=req.anomaly_rate
    )
    return {
        "status": "success",
        "message": f"Successfully generated and reconciled {req.records_count} records.",
        "summary": result["summary"]
    }
