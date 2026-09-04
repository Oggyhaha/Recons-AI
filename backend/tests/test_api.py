import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "HEALTHY"

def test_imports_status():
    res = client.get("/api/v1/imports/status")
    assert res.status_code == 200
    data = res.json()
    assert data["records_count"] == 500
    assert len(data["sources"]) == 5

def test_latest_reconciliation_run():
    res = client.get("/api/v1/reconciliation/runs/latest")
    assert res.status_code == 200
    data = res.json()
    assert data["total_records"] >= 490
    assert data["match_rate"] > 80.0
    assert data["status"] == "COMPLETED"

def test_exceptions_and_clustering():
    res = client.get("/api/v1/exceptions")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] > 0
    assert len(data["items"]) > 0
    
    # Test clusters
    c_res = client.get("/api/v1/exceptions/clusters")
    assert c_res.status_code == 200
    clusters = c_res.json()["clusters"]
    assert len(clusters) > 0

def test_cash_position_and_forecast():
    res = client.get("/api/v1/cash/current")
    assert res.status_code == 200
    assert "formatted_available" in res.json()
    
    f_res = client.get("/api/v1/cash/forecast?horizon_days=7")
    assert f_res.status_code == 200
    assert len(f_res.json()["timeline"]) == 7

def test_evaluation_report_against_ground_truth():
    res = client.get("/api/v1/evaluation/report")
    assert res.status_code == 200
    data = res.json()
    assert data["accuracy_percentage"] >= 90.0
    assert len(data["comparison_table"]) == 5
    assert len(data["honest_exception_list"]) > 0

def test_ai_copilot_ask():
    res = client.post("/api/v1/agent/ask", json={"query": "Why is today's settlement lower than expected?"})
    assert res.status_code == 200
    data = res.json()
    assert "settlement" in data["answer"].lower()
    assert data["confidence"] > 0.90
    assert len(data["tools_used"]) > 0

def test_human_in_the_loop_review_and_audit():
    # Pick first open exception
    excs_res = client.get("/api/v1/exceptions")
    first_exc = excs_res.json()["items"][0]
    tx_id = first_exc["transaction_id"]
    
    review_res = client.post(
        f"/api/v1/exceptions/{tx_id}/review",
        json={
            "action": "APPROVE",
            "notes": "Verified against merchant contract addendum #881",
            "actor_id": "CONTROLLER_AARAV"
        }
    )
    assert review_res.status_code == 200
    assert review_res.json()["exception"]["status"] == "RESOLVED"
    
    # Verify audit log updated
    audit_res = client.get("/api/v1/audit/logs")
    assert audit_res.status_code == 200
    latest_event = audit_res.json()["logs"][0]
    assert latest_event["action"] == "EXCEPTION_APPROVE"
    assert latest_event["entity_id"] == tx_id
    assert "tamper_hash" in latest_event
