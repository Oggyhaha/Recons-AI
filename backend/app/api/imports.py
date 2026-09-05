import csv
import io
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Response, Query
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from app.services.state_store import system_state
from app.models.schemas import FinSimGenerateRequest
from app.services.audit_service import audit_service
from app.services.exceptions import ExceptionManagementService
from app.services.cash_engine import CashEngine

router = APIRouter(prefix="/imports", tags=["Imports & Data Ingestion"])

SAMPLE_TEMPLATES = {
    "unified": {
        "filename": "unified_transactions_template.csv",
        "description": "Multi-Source Unified Transaction Sheet (Orders, Payments, Settlements, Bank)",
        "content": (
            "order_id,payment_id,gross_amount,fee_amount,tax_amount,net_amount,utr,transaction_date\n"
            "ORD-CSV-1001,PAY-CSV-1001,5000.00,90.00,16.20,4893.80,UTR-HDFC-99201,2026-09-04T10:00:00Z\n"
            "ORD-CSV-1002,PAY-CSV-1002,3200.00,57.60,10.37,3132.03,UTR-HDFC-99202,2026-09-04T10:30:00Z\n"
            "ORD-CSV-1003,PAY-CSV-1003,7500.00,135.00,24.30,7340.70,UTR-HDFC-99203,2026-09-04T11:00:00Z\n"
            "ORD-CSV-1004,PAY-CSV-1004,1800.00,32.40,5.83,1761.77,UTR-HDFC-99204,2026-09-04T11:30:00Z\n"
            "ORD-CSV-1005,PAY-CSV-1005,12000.00,216.00,38.88,11745.12,UTR-HDFC-99205,2026-09-04T12:00:00Z\n"
        )
    },
    "bank_statement": {
        "filename": "bank_statement_template.csv",
        "description": "HDFC / ICICI Bank Statement Payout Credit Export",
        "content": (
            "bank_transaction_id,bank_reference,amount,transaction_date,description\n"
            "BNK-HDFC-01,UTR-HDFC-99201,4893.80,2026-09-05T08:30:00Z,Razorpay Payout Credit\n"
            "BNK-HDFC-02,UTR-HDFC-99202,3132.03,2026-09-05T08:35:00Z,Razorpay Payout Credit\n"
            "BNK-HDFC-03,UTR-HDFC-99203,7340.70,2026-09-05T08:40:00Z,Razorpay Payout Credit\n"
        )
    },
    "orders": {
        "filename": "orders_commerce_template.csv",
        "description": "Shopify / ERP Gross Orders Export",
        "content": (
            "order_id,gross_amount,currency,order_date\n"
            "ORD-STORE-501,4500.00,INR,2026-09-04T09:00:00Z\n"
            "ORD-STORE-502,2800.00,INR,2026-09-04T09:15:00Z\n"
            "ORD-STORE-503,9900.00,INR,2026-09-04T09:30:00Z\n"
        )
    }
}

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

@router.get("/sample-templates")
async def get_sample_templates():
    """
    Returns list and metadata of downloadable sample CSV templates.
    """
    return {
        "templates": [
            {
                "key": k,
                "filename": v["filename"],
                "description": v["description"]
            }
            for k, v in SAMPLE_TEMPLATES.items()
        ]
    }

@router.get("/sample-templates/download")
async def download_sample_template(type: str = Query("unified", description="Template type: unified, bank_statement, orders")):
    tpl = SAMPLE_TEMPLATES.get(type)
    if not tpl:
        raise HTTPException(status_code=404, detail="Template type not found. Use unified, bank_statement, or orders.")
    return Response(
        content=tpl["content"],
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{tpl["filename"]}"'}
    )

@router.post("/upload-csv")
async def upload_csv_file(
    file: UploadFile = File(...),
    source_type: str = Form("AUTO_DETECT")
):
    """
    Ingests a user-uploaded CSV file (Orders, Settlements, Bank Statements, or Unified).
    Parses currency to minor units (Paise), merges records into the active ledger state,
    and runs deterministic reconciliation instantly.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    content = await file.read()
    try:
        text_content = content.decode("utf-8-sig")
    except Exception:
        text_content = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text_content))
    rows = list(reader)
    if not rows:
        raise HTTPException(status_code=400, detail="Uploaded CSV file is empty.")

    now_iso = datetime.now(timezone.utc).isoformat()
    parsed_orders = []
    parsed_payments = []
    parsed_settlements = []
    parsed_banks = []

    for idx, row in enumerate(rows):
        # Normalize key names: remove spaces, lowercase, strip
        norm_row = {k.strip().lower().replace(" ", "_"): v.strip() for k, v in row.items() if k}
        
        # Extract identifiers
        order_id = norm_row.get("order_id") or norm_row.get("orderid") or norm_row.get("id") or f"ORD-UP-{idx+1}"
        payment_id = norm_row.get("payment_id") or norm_row.get("paymentid") or f"PAY-UP-{idx+1}"
        settlement_id = norm_row.get("settlement_id") or norm_row.get("settlementid") or f"SET-UP-{idx+1}"
        utr = norm_row.get("utr") or norm_row.get("bank_reference") or norm_row.get("reference") or f"UTR-UP-{idx+1}"

        # Parse amounts (in Rupees -> converted to Paise)
        def parse_paise(val_str, default=0):
            if not val_str:
                return default
            try:
                # Remove currency symbols or commas
                cleaned = str(val_str).replace("₹", "").replace(",", "").strip()
                return int(round(float(cleaned) * 100))
            except Exception:
                return default

        gross_paise = parse_paise(norm_row.get("gross_amount") or norm_row.get("amount") or norm_row.get("gross"))
        if gross_paise == 0 and "net_amount" in norm_row:
            gross_paise = parse_paise(norm_row.get("net_amount"))

        fee_paise = parse_paise(norm_row.get("fee_amount") or norm_row.get("fee") or norm_row.get("fees"))
        if fee_paise == 0:
            fee_paise = int(round(gross_paise * 0.018))

        tax_paise = parse_paise(norm_row.get("tax_amount") or norm_row.get("tax"))
        if tax_paise == 0:
            tax_paise = int(round(fee_paise * 0.18))

        net_paise = parse_paise(norm_row.get("net_amount") or norm_row.get("net"))
        if net_paise == 0:
            net_paise = gross_paise - fee_paise - tax_paise

        # 1. Orders
        parsed_orders.append({
            "order_id": order_id,
            "gross_amount_minor": gross_paise,
            "currency": norm_row.get("currency", "INR"),
            "status": "PAID",
            "created_at": norm_row.get("transaction_date", now_iso)
        })

        # 2. Payments
        parsed_payments.append({
            "payment_id": payment_id,
            "order_id": order_id,
            "gross_amount_minor": gross_paise,
            "fee_amount_minor": fee_paise,
            "tax_amount_minor": tax_paise,
            "net_amount_minor": net_paise,
            "currency": "INR",
            "status": "captured",
            "settlement_id": settlement_id,
            "captured_at": norm_row.get("transaction_date", now_iso)
        })

        # 3. Settlements
        parsed_settlements.append({
            "settlement_id": settlement_id,
            "gross_amount_minor": gross_paise,
            "fee_amount_minor": fee_paise,
            "tax_amount_minor": tax_paise,
            "net_amount_minor": net_paise,
            "utr": utr,
            "status": "processed",
            "settled_at": norm_row.get("transaction_date", now_iso)
        })

        # 4. Bank Statement Line
        parsed_banks.append({
            "bank_transaction_id": f"BNK-{idx+1}",
            "bank_reference": utr,
            "amount_minor": net_paise,
            "transaction_date": norm_row.get("transaction_date", now_iso),
            "status": "POSTED"
        })

    # Ingest into system state current_batch
    system_state.current_batch["orders"] = parsed_orders
    system_state.current_batch["payments"] = parsed_payments
    system_state.current_batch["settlements"] = parsed_settlements
    system_state.current_batch["bank_transactions"] = parsed_banks
    system_state.current_batch["metadata"] = {
        "records_count": len(parsed_orders),
        "clean_count": len(parsed_orders),
        "anomaly_count": 0,
        "anomaly_rate": 0.0,
        "source": f"Uploaded File: {file.filename}"
    }

    # Execute full reconciliation on newly uploaded batch
    recon_res = system_state.recon_engine.reconcile_batch(
        orders=parsed_orders,
        payments=parsed_payments,
        settlements=parsed_settlements,
        bank_transactions=parsed_banks,
        refunds=system_state.current_batch.get("refunds", []),
        adjustments=system_state.current_batch.get("adjustments", [])
    )
    system_state.reconciliation_data = recon_res
    system_state.exceptions_list = list(recon_res.get("exceptions", []))
    system_state.clusters_list = ExceptionManagementService.cluster_exceptions(system_state.exceptions_list)

    # Recalculate Cash Position
    system_state.cash_position_data = CashEngine.calculate_cash_position(
        bank_transactions=parsed_banks,
        settlements=parsed_settlements,
        refunds=system_state.current_batch.get("refunds", []),
        exceptions=system_state.exceptions_list
    )

    # Cryptographic Audit Log
    audit_service.record_event(
        actor_type="USER",
        actor_id="FINANCE_CONTROLLER",
        action="CSV_BATCH_UPLOADED",
        entity_type="IMPORT_BATCH",
        entity_id=f"CSV-{len(parsed_orders)}",
        after_state=recon_res["summary"],
        reason=f"Uploaded and reconciled {len(parsed_orders)} records from '{file.filename}'."
    )

    return {
        "status": "success",
        "message": f"Successfully parsed and reconciled {len(parsed_orders)} records from '{file.filename}'.",
        "filename": file.filename,
        "parsed_rows": len(parsed_orders),
        "summary": recon_res["summary"],
        "cash_position": system_state.cash_position_data
    }
