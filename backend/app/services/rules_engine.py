from datetime import datetime, timedelta
from typing import Dict, Any, List

class SettlementRulePolicy:
    def __init__(
        self,
        version: str = "v1.0",
        fee_mdr_rate: float = 0.018,       # 1.8%
        fee_fixed_paise: int = 300,        # ₹3.00
        gst_rate: float = 0.18,            # 18% GST on fees
        amount_tolerance_paise: int = 200, # ₹2.00 tolerance
        settlement_window_days: int = 2,   # T+2
        max_timing_tolerance_days: int = 5,
        high_risk_threshold_paise: int = 5000000,   # ₹50,000
        critical_risk_threshold_paise: int = 20000000 # ₹200,000
    ):
        self.version = version
        self.fee_mdr_rate = fee_mdr_rate
        self.fee_fixed_paise = fee_fixed_paise
        self.gst_rate = gst_rate
        self.amount_tolerance_paise = amount_tolerance_paise
        self.settlement_window_days = settlement_window_days
        self.max_timing_tolerance_days = max_timing_tolerance_days
        self.high_risk_threshold_paise = high_risk_threshold_paise
        self.critical_risk_threshold_paise = critical_risk_threshold_paise

    def calculate_expected_settlement(
        self,
        gross_amount_minor: int,
        adjustments_minor: int = 0,
        refunds_minor: int = 0,
        transfers_minor: int = 0
    ) -> Dict[str, int]:
        """
        Razorpay Settlement Breakdown Formula:
        Gross Payment - Fee - Tax - Adjustments - Transfers + Refunds = Net Settlement
        """
        fee_minor = int(round(gross_amount_minor * self.fee_mdr_rate)) + self.fee_fixed_paise
        tax_minor = int(round(fee_minor * self.gst_rate))
        net_settlement_minor = (
            gross_amount_minor
            - fee_minor
            - tax_minor
            - adjustments_minor
            - transfers_minor
            - refunds_minor  # Deducted from settlement payout
        )
        return {
            "gross_minor": gross_amount_minor,
            "fee_minor": fee_minor,
            "tax_minor": tax_minor,
            "adjustments_minor": adjustments_minor,
            "refunds_minor": refunds_minor,
            "transfers_minor": transfers_minor,
            "expected_net_minor": net_settlement_minor
        }

    def is_within_amount_tolerance(self, expected_minor: int, actual_minor: int) -> bool:
        return abs(expected_minor - actual_minor) <= self.amount_tolerance_paise

    def is_within_settlement_window(self, captured_at: datetime, settled_at: datetime) -> bool:
        diff_days = (settled_at.date() - captured_at.date()).days
        # Allow between 0 and max_timing_tolerance_days to account for weekends/holidays
        return 0 <= diff_days <= self.max_timing_tolerance_days

    def evaluate_risk_level(self, amount_minor: int, confidence: float, exception_type: str) -> str:
        if amount_minor >= self.critical_risk_threshold_paise or exception_type in ("UNKNOWN_PAYMENT", "DUPLICATE"):
            return "CRITICAL"
        if amount_minor >= self.high_risk_threshold_paise or confidence < 0.80 or exception_type in ("PARTIAL_SETTLEMENT", "MISSING_BANK_CREDIT"):
            return "HIGH"
        if amount_minor >= 1000000 or confidence < 0.90:  # ₹10,000
            return "MEDIUM"
        return "LOW"

# Default instance
default_policy = SettlementRulePolicy()
