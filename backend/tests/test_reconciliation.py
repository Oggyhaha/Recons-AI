import pytest
from app.services.rules_engine import default_policy
from app.services.reconciliation import ReconciliationEngine
from app.simulator.finsim import FinSim

def test_settlement_calculation_formula():
    """Verify Razorpay standard settlement formula: Gross - Fee - Tax = Net."""
    gross_paise = 1000000 # ₹10,000.00
    calc = default_policy.calculate_expected_settlement(gross_paise)
    
    # 1.8% of 1000000 = 18000 + 300 = 18300 paise (₹183.00)
    assert calc["fee_minor"] == 18300
    # 18% GST on 18300 = 3294 paise (₹32.94)
    assert calc["tax_minor"] == 3294
    # Net = 1000000 - 18300 - 3294 = 978406 paise (₹9,784.06)
    assert calc["expected_net_minor"] == 978406

def test_reconciliation_batch_execution():
    """Verify end-to-end reconciliation on a 50-record batch."""
    sim = FinSim(seed=123)
    batch = sim.generate_batch(record_count=50, anomaly_rate=0.10)
    engine = ReconciliationEngine()
    
    recon = engine.reconcile_batch(
        orders=batch["orders"],
        payments=batch["payments"],
        settlements=batch["settlements"],
        bank_transactions=batch["bank_transactions"],
        refunds=batch["refunds"],
        adjustments=batch["adjustments"]
    )
    
    summary = recon["summary"]
    assert summary["total_records"] == 50
    assert summary["matched_count"] > 40
    assert summary["match_rate"] > 80.0
    assert len(recon["results"]) == 50
