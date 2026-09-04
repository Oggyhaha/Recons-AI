from enum import Enum
from typing import Dict, Any

class FailureScenario(str, Enum):
    CLEAN_SETTLEMENT = "CLEAN_SETTLEMENT"
    MISSING_SETTLEMENT = "MISSING_SETTLEMENT"
    MISSING_BANK_CREDIT = "MISSING_BANK_CREDIT"
    MISSING_PAYMENT = "MISSING_PAYMENT"
    PARTIAL_SETTLEMENT = "PARTIAL_SETTLEMENT"
    REFUND_BEFORE_SETTLEMENT = "REFUND_BEFORE_SETTLEMENT"
    FEE_CONFIG_ERROR = "FEE_CONFIG_ERROR"
    TAX_DISCREPANCY = "TAX_DISCREPANCY"
    DUPLICATE_PAYMENT = "DUPLICATE_PAYMENT"
    TIMING_DELAY = "TIMING_DELAY"
    AMBIGUOUS_CANDIDATE = "AMBIGUOUS_CANDIDATE"
    UNKNOWN_PAYMENT = "UNKNOWN_PAYMENT"

SCENARIO_DESCRIPTIONS: Dict[FailureScenario, str] = {
    FailureScenario.CLEAN_SETTLEMENT: "Order -> Payment -> Fee/Tax calculation -> Settlement -> Bank Credit perfectly aligned.",
    FailureScenario.MISSING_SETTLEMENT: "Payment was captured successfully, but no settlement record exists in gateway batch.",
    FailureScenario.MISSING_BANK_CREDIT: "Settlement marked as completed by gateway, but no matching credit appears on bank statement.",
    FailureScenario.MISSING_PAYMENT: "Order recorded in commerce system, but no corresponding payment captured by gateway.",
    FailureScenario.PARTIAL_SETTLEMENT: "Settlement contains only partial payout of payment amount; balance withheld by gateway.",
    FailureScenario.REFUND_BEFORE_SETTLEMENT: "Customer refund processed before T+2 settlement cycle, resulting in net deduction.",
    FailureScenario.FEE_CONFIG_ERROR: "MDR fee charged at 2.5% instead of merchant contract rate of 1.8% + ₹3.00.",
    FailureScenario.TAX_DISCREPANCY: "GST applied on fee was miscalculated due to legacy tax rate mismatch.",
    FailureScenario.DUPLICATE_PAYMENT: "Two distinct gateway payment authorizations registered for the same order reference.",
    FailureScenario.TIMING_DELAY: "Bank credit delayed beyond expected T+2 business days due to bank holiday.",
    FailureScenario.AMBIGUOUS_CANDIDATE: "Multiple settlement credits sharing identical amounts and close timestamps.",
    FailureScenario.UNKNOWN_PAYMENT: "Payment captured at gateway with invalid or unmapped merchant order reference."
}
