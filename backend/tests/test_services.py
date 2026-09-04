import pytest
from app.simulator.finsim import FinSim
from app.services.cash_engine import CashEngine
from app.services.reconciliation import ReconciliationEngine
from app.services.evaluation import EvaluationEngine

def test_finsim_reproducibility():
    """Verify that same seed produces identical datasets."""
    sim1 = FinSim(seed=42)
    b1 = sim1.generate_batch(record_count=100, anomaly_rate=0.20)
    
    sim2 = FinSim(seed=42)
    b2 = sim2.generate_batch(record_count=100, anomaly_rate=0.20)
    
    assert len(b1["orders"]) == 100
    assert b1["orders"][0]["order_id"] == b2["orders"][0]["order_id"]
    assert b1["orders"][0]["gross_amount_minor"] == b2["orders"][0]["gross_amount_minor"]

def test_cash_engine_and_forecasting():
    """Verify cash position calculation and 7-day forecast."""
    sim = FinSim(seed=99)
    batch = sim.generate_batch(record_count=50, anomaly_rate=0.10)
    
    cash_pos = CashEngine.calculate_cash_position(
        bank_transactions=batch["bank_transactions"],
        settlements=batch["settlements"],
        refunds=batch["refunds"],
        exceptions=[]
    )
    
    assert cash_pos["available_minor"] > 0
    assert cash_pos["expected_settlements_minor"] > 0
    assert "₹" in cash_pos["formatted_available"]
    
    forecast = CashEngine.generate_cash_forecast(cash_pos, horizon_days=7)
    assert len(forecast["timeline"]) == 7
    assert forecast["projected_amount_minor"] >= forecast["lower_bound_minor"]

def test_evaluation_and_honest_exception_list():
    """Verify that ground truth evaluation generates precision, recall, and honest exception list."""
    sim = FinSim(seed=55)
    batch = sim.generate_batch(record_count=100, anomaly_rate=0.15)
    recon = ReconciliationEngine().reconcile_batch(
        orders=batch["orders"],
        payments=batch["payments"],
        settlements=batch["settlements"],
        bank_transactions=batch["bank_transactions"],
        refunds=batch["refunds"]
    )
    
    report = EvaluationEngine.evaluate_batch(
        reconciliation_results=recon["results"],
        ground_truth=batch["ground_truth"],
        throughput_rps=50.0
    )
    
    assert report["accuracy_percentage"] >= 90.0
    assert report["precision_percentage"] >= 90.0
    assert len(report["honest_exception_list"]) > 0
    assert len(report["comparison_table"]) == 5
