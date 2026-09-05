import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_dispute_package_generation():
    # 1. Fetch exceptions
    excs_res = client.get("/api/v1/exceptions")
    assert excs_res.status_code == 200
    items = excs_res.json()["items"]
    assert len(items) > 0

    tx_id = items[0]["transaction_id"]

    # 2. Request dispute package
    disp_res = client.get(f"/api/v1/exceptions/{tx_id}/dispute-package")
    assert disp_res.status_code == 200
    data = disp_res.json()

    assert "dispute_reference" in data
    assert "formal_memo" in data
    assert "RAZORPAY MERCHANT DISPUTE" in data["formal_memo"]
    assert "csv_evidence" in data
    assert "Dispute_Reference" in data["csv_evidence"]
    assert data["transaction_id"] == tx_id

    # 3. Request dispute CSV download
    csv_res = client.get(f"/api/v1/exceptions/{tx_id}/dispute-package/download-csv")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert len(csv_res.text) > 50

def test_journal_export_and_balance():
    # 1. JSON Journal Export
    res = client.get("/api/v1/reconciliation/journal-export?format=json")
    assert res.status_code == 200
    data = res.json()

    assert data["is_balanced"] is True
    assert data["total_debit_paise"] == data["total_credit_paise"]
    assert len(data["lines"]) >= 4

    # Verify debit and credit accounts
    has_bank = any("Bank" in l["account_name"] and l["type"] == "DEBIT" for l in data["lines"])
    has_mdr = any("Processing Fees" in l["account_name"] and l["type"] == "DEBIT" for l in data["lines"])
    has_gst = any("GST" in l["account_name"] and l["type"] == "DEBIT" for l in data["lines"])
    has_sales = any("Sales" in l["account_name"] and l["type"] == "CREDIT" for l in data["lines"])

    assert has_bank and has_mdr and has_gst and has_sales

    # 2. CSV Journal Export
    csv_res = client.get("/api/v1/reconciliation/journal-export?format=csv")
    assert csv_res.status_code == 200
    assert "Voucher_Number" in csv_res.text

    # 3. Tally XML Export
    xml_res = client.get("/api/v1/reconciliation/journal-export?format=tally_xml")
    assert xml_res.status_code == 200
    assert "<ENVELOPE>" in xml_res.text
    assert "<TALLYMESSAGE" in xml_res.text

def test_sample_csv_templates():
    tpl_res = client.get("/api/v1/imports/sample-templates")
    assert tpl_res.status_code == 200
    assert len(tpl_res.json()["templates"]) >= 3

    dl_res = client.get("/api/v1/imports/sample-templates/download?type=unified")
    assert dl_res.status_code == 200
    assert "order_id" in dl_res.text
    assert "gross_amount" in dl_res.text

def test_csv_upload_and_instant_reconciliation():
    sample_csv = (
        "order_id,payment_id,gross_amount,fee_amount,tax_amount,net_amount,utr,transaction_date\n"
        "ORD-TEST-01,PAY-TEST-01,1000.00,18.00,3.24,978.76,UTR-TEST-01,2026-09-05T10:00:00Z\n"
        "ORD-TEST-02,PAY-TEST-02,2000.00,36.00,6.48,1957.52,UTR-TEST-02,2026-09-05T10:15:00Z\n"
    )

    files = {"file": ("test_batch.csv", io.BytesIO(sample_csv.encode("utf-8")), "text/csv")}
    upload_res = client.post("/api/v1/imports/upload-csv", files=files)
    assert upload_res.status_code == 200
    data = upload_res.json()
    assert data["status"] == "success"
    assert data["parsed_rows"] == 2
    assert "summary" in data

def test_razorpay_webhook_simulation_and_verification():
    # 1. Signature failure test on raw endpoint
    bogus_res = client.post(
        "/api/v1/webhooks/razorpay",
        headers={"X-Razorpay-Signature": "invalid_sig_12345"},
        json={"event": "payment.captured"}
    )
    assert bogus_res.status_code == 400

    # 2. Simulator endpoint (generates authentic HMAC-SHA256 signature)
    sim_res = client.post(
        "/api/v1/webhooks/razorpay/simulate",
        json={"event": "payment.captured", "amount_inr": 2500.00}
    )
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert sim_data["status"] == "success"
    assert sim_data["signature_verified"] is True
    assert "simulated_signature" in sim_data

    # 3. Check Webhook Logs
    logs_res = client.get("/api/v1/webhooks/logs")
    assert logs_res.status_code == 200
    logs_data = logs_res.json()
    assert logs_data["secret_status"] == "CONFIGURED_ACTIVE"
    assert len(logs_data["events"]) > 0
