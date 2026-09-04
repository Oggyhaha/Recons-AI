import random
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Tuple
from app.simulator.scenarios import FailureScenario

class FinSim:
    def __init__(self, seed: int = 42):
        self.seed = seed
        self.rng = random.Random(seed)

    def generate_batch(
        self,
        record_count: int = 500,
        anomaly_rate: float = 0.15,
        base_date: datetime = None
    ) -> Dict[str, Any]:
        """
        Generates a comprehensive multi-source synthetic financial batch
        with controlled anomaly injection and hidden ground truth.
        """
        if base_date is None:
            base_date = datetime(2026, 8, 20, 10, 0, 0, tzinfo=timezone.utc)

        orders: List[Dict[str, Any]] = []
        payments: List[Dict[str, Any]] = []
        settlements: List[Dict[str, Any]] = []
        bank_transactions: List[Dict[str, Any]] = []
        refunds: List[Dict[str, Any]] = []
        adjustments: List[Dict[str, Any]] = []
        ground_truth: Dict[str, Dict[str, Any]] = {}

        merchants = ["merch_delhi_retail", "merch_mumbai_cloud", "merch_bengaluru_d2c", "merch_hyderabad_tech"]
        payment_methods = ["UPI", "CREDIT_CARD", "DEBIT_CARD", "NET_BANKING"]

        # Calculate scenario distribution
        clean_count = int(record_count * (1.0 - anomaly_rate))
        anomaly_count = record_count - clean_count

        # Specific distribution of anomalies
        scenarios_pool = [
            (FailureScenario.MISSING_SETTLEMENT, 0.15),
            (FailureScenario.MISSING_BANK_CREDIT, 0.12),
            (FailureScenario.MISSING_PAYMENT, 0.10),
            (FailureScenario.PARTIAL_SETTLEMENT, 0.12),
            (FailureScenario.REFUND_BEFORE_SETTLEMENT, 0.10),
            (FailureScenario.FEE_CONFIG_ERROR, 0.15),
            (FailureScenario.TAX_DISCREPANCY, 0.08),
            (FailureScenario.DUPLICATE_PAYMENT, 0.06),
            (FailureScenario.TIMING_DELAY, 0.06),
            (FailureScenario.AMBIGUOUS_CANDIDATE, 0.04),
            (FailureScenario.UNKNOWN_PAYMENT, 0.02)
        ]

        assigned_scenarios: List[FailureScenario] = [FailureScenario.CLEAN_SETTLEMENT] * clean_count
        for scenario, weight in scenarios_pool:
            count = int(round(anomaly_count * weight))
            assigned_scenarios.extend([scenario] * count)

        # Pad or trim to exact record_count
        while len(assigned_scenarios) < record_count:
            assigned_scenarios.append(FailureScenario.CLEAN_SETTLEMENT)
        assigned_scenarios = assigned_scenarios[:record_count]
        self.rng.shuffle(assigned_scenarios)

        settlement_batch_counter = 100

        for i in range(record_count):
            scenario = assigned_scenarios[i]
            idx_str = f"{i+1:04d}"
            order_id = f"ORD-{idx_str}"
            payment_id = f"pay_rzp_{idx_str}"
            settlement_id = f"SET-{idx_str}"
            bank_id = f"BANK-TXN-{idx_str}"
            utr_ref = f"UTR{self.rng.randint(10000000, 99999999)}"

            # Standard gross amounts between ₹250 and ₹25,000 (represented in paise)
            gross_rupees = self.rng.choice([499, 999, 1499, 2499, 4999, 8500, 12000, 18500, 24990, 87000])
            gross_paise = gross_rupees * 100

            # Razorpay standard fee formula: 1.8% MDR + ₹3.00 fixed
            fee_paise = int(round(gross_paise * 0.018)) + 300
            # Standard GST: 18% on fee
            tax_paise = int(round(fee_paise * 0.18))
            net_settlement_paise = gross_paise - fee_paise - tax_paise

            tx_time = base_date + timedelta(minutes=i * 4, seconds=self.rng.randint(0, 59))
            capture_time = tx_time + timedelta(seconds=self.rng.randint(2, 45))
            settle_date = tx_time + timedelta(days=2) # T+2
            bank_date = settle_date + timedelta(hours=4)

            merchant = self.rng.choice(merchants)
            method = self.rng.choice(payment_methods)

            order_record = {
                "order_id": order_id,
                "customer_id": f"CUST-{self.rng.randint(100, 999)}",
                "order_date": tx_time.isoformat(),
                "gross_amount_minor": gross_paise,
                "gross_amount_inr": gross_rupees,
                "currency": "INR",
                "status": "PAID"
            }

            payment_record = {
                "payment_id": payment_id,
                "order_id": order_id,
                "gateway_reference": f"gref_{idx_str}",
                "payment_date": capture_time.isoformat(),
                "gross_amount_minor": gross_paise,
                "fee_minor": fee_paise,
                "tax_minor": tax_paise,
                "net_amount_minor": net_settlement_paise,
                "currency": "INR",
                "status": "CAPTURED",
                "payment_method": method,
                "settlement_id": settlement_id,
                "merchant": merchant
            }

            settlement_record = {
                "settlement_id": settlement_id,
                "settlement_date": settle_date.strftime("%Y-%m-%d"),
                "gross_amount_minor": gross_paise,
                "fee_minor": fee_paise,
                "tax_minor": tax_paise,
                "adjustment_minor": 0,
                "refund_minor": 0,
                "net_amount_minor": net_settlement_paise,
                "currency": "INR",
                "status": "SETTLED",
                "utr": utr_ref
            }

            bank_record = {
                "bank_transaction_id": bank_id,
                "transaction_date": bank_date.isoformat(),
                "amount_minor": net_settlement_paise,
                "credit_inr": net_settlement_paise / 100.0,
                "debit_inr": 0.0,
                "currency": "INR",
                "direction": "CREDIT",
                "bank_reference": utr_ref,
                "description": f"CMS/RAZORPAY/{settlement_id}/{utr_ref}",
                "status": "POSTED"
            }

            # Scenario Execution & Anomaly Corruptions
            if scenario == FailureScenario.CLEAN_SETTLEMENT:
                orders.append(order_record)
                payments.append(payment_record)
                settlements.append(settlement_record)
                bank_transactions.append(bank_record)
                ground_truth[order_id] = {
                    "expected_decision": "MATCHED",
                    "expected_match_ids": [payment_id, settlement_id, bank_id],
                    "expected_reason_code": "EXACT_RECONCILED",
                    "expected_variance_minor": 0,
                    "is_auto_resolvable": True,
                    "honest_exception": False
                }

            elif scenario == FailureScenario.MISSING_SETTLEMENT:
                orders.append(order_record)
                payment_record["settlement_id"] = None
                payments.append(payment_record)
                # Omit settlement and bank
                ground_truth[order_id] = {
                    "expected_decision": "MISSING_SETTLEMENT",
                    "expected_match_ids": [payment_id],
                    "expected_reason_code": "GATEWAY_SETTLEMENT_PENDING",
                    "expected_variance_minor": net_settlement_paise,
                    "is_auto_resolvable": False,
                    "honest_exception": True
                }

            elif scenario == FailureScenario.MISSING_BANK_CREDIT:
                orders.append(order_record)
                payments.append(payment_record)
                settlements.append(settlement_record)
                # Omit bank record
                ground_truth[order_id] = {
                    "expected_decision": "MISSING_BANK_CREDIT",
                    "expected_match_ids": [payment_id, settlement_id],
                    "expected_reason_code": "BANK_CLEARING_UNCONFIRMED",
                    "expected_variance_minor": net_settlement_paise,
                    "is_auto_resolvable": False,
                    "honest_exception": True
                }

            elif scenario == FailureScenario.MISSING_PAYMENT:
                orders.append(order_record)
                # Omit payment, settlement, bank
                ground_truth[order_id] = {
                    "expected_decision": "MISSING_PAYMENT",
                    "expected_match_ids": [],
                    "expected_reason_code": "PAYMENT_NOT_CAPTURED",
                    "expected_variance_minor": gross_paise,
                    "is_auto_resolvable": False,
                    "honest_exception": True
                }

            elif scenario == FailureScenario.PARTIAL_SETTLEMENT:
                orders.append(order_record)
                # Only 70% settled
                actual_settled_paise = int(net_settlement_paise * 0.70)
                settlement_record["net_amount_minor"] = actual_settled_paise
                settlement_record["status"] = "PARTIALLY_SETTLED"
                bank_record["amount_minor"] = actual_settled_paise
                bank_record["credit_inr"] = actual_settled_paise / 100.0

                payments.append(payment_record)
                settlements.append(settlement_record)
                bank_transactions.append(bank_record)
                ground_truth[order_id] = {
                    "expected_decision": "PARTIAL_SETTLEMENT",
                    "expected_match_ids": [payment_id, settlement_id, bank_id],
                    "expected_reason_code": "PARTIAL_PAYOUT_RETAINED",
                    "expected_variance_minor": net_settlement_paise - actual_settled_paise,
                    "is_auto_resolvable": False,  # Requires HITL review
                    "honest_exception": True
                }

            elif scenario == FailureScenario.REFUND_BEFORE_SETTLEMENT:
                orders.append(order_record)
                refund_paise = gross_paise // 2  # 50% partial refund
                refund_id = f"rfnd_{idx_str}"
                refund_record = {
                    "refund_id": refund_id,
                    "payment_id": payment_id,
                    "amount_minor": refund_paise,
                    "currency": "INR",
                    "date": (capture_time + timedelta(hours=6)).isoformat(),
                    "status": "PROCESSED"
                }
                refunds.append(refund_record)

                # Settlement incorporates refund deduction
                settlement_record["refund_minor"] = refund_paise
                adjusted_net = net_settlement_paise - refund_paise
                settlement_record["net_amount_minor"] = adjusted_net
                bank_record["amount_minor"] = adjusted_net
                bank_record["credit_inr"] = adjusted_net / 100.0

                payments.append(payment_record)
                settlements.append(settlement_record)
                bank_transactions.append(bank_record)
                ground_truth[order_id] = {
                    "expected_decision": "MATCHED",
                    "expected_match_ids": [payment_id, settlement_id, bank_id, refund_id],
                    "expected_reason_code": "REFUND_ADJUSTED_MATCH",
                    "expected_variance_minor": 0,
                    "is_auto_resolvable": True,
                    "honest_exception": False
                }

            elif scenario == FailureScenario.FEE_CONFIG_ERROR:
                orders.append(order_record)
                # Erroneously charged 2.5% fee instead of 1.8%
                wrong_fee = int(round(gross_paise * 0.025)) + 300
                wrong_tax = int(round(wrong_fee * 0.18))
                wrong_net = gross_paise - wrong_fee - wrong_tax

                payment_record["fee_minor"] = wrong_fee
                payment_record["tax_minor"] = wrong_tax
                payment_record["net_amount_minor"] = wrong_net

                settlement_record["fee_minor"] = wrong_fee
                settlement_record["tax_minor"] = wrong_tax
                settlement_record["net_amount_minor"] = wrong_net

                bank_record["amount_minor"] = wrong_net
                bank_record["credit_inr"] = wrong_net / 100.0

                payments.append(payment_record)
                settlements.append(settlement_record)
                bank_transactions.append(bank_record)
                ground_truth[order_id] = {
                    "expected_decision": "FEE_MISMATCH",
                    "expected_match_ids": [payment_id, settlement_id, bank_id],
                    "expected_reason_code": "MDR_CONFIG_VARIANCE",
                    "expected_variance_minor": wrong_fee - fee_paise,
                    "is_auto_resolvable": False,
                    "honest_exception": True
                }

            elif scenario == FailureScenario.TAX_DISCREPANCY:
                orders.append(order_record)
                # Erroneously applied 12% GST instead of 18%
                wrong_tax = int(round(fee_paise * 0.12))
                wrong_net = gross_paise - fee_paise - wrong_tax

                payment_record["tax_minor"] = wrong_tax
                payment_record["net_amount_minor"] = wrong_net
                settlement_record["tax_minor"] = wrong_tax
                settlement_record["net_amount_minor"] = wrong_net
                bank_record["amount_minor"] = wrong_net
                bank_record["credit_inr"] = wrong_net / 100.0

                payments.append(payment_record)
                settlements.append(settlement_record)
                bank_transactions.append(bank_record)
                ground_truth[order_id] = {
                    "expected_decision": "TAX_MISMATCH",
                    "expected_match_ids": [payment_id, settlement_id, bank_id],
                    "expected_reason_code": "GST_RATE_DISCREPANCY",
                    "expected_variance_minor": tax_paise - wrong_tax,
                    "is_auto_resolvable": False,
                    "honest_exception": True
                }

            elif scenario == FailureScenario.DUPLICATE_PAYMENT:
                orders.append(order_record)
                payments.append(payment_record)
                # Duplicate authorization
                dup_payment = dict(payment_record)
                dup_payment["payment_id"] = f"{payment_id}_dup"
                dup_payment["gateway_reference"] = f"gref_{idx_str}_dup"
                payments.append(dup_payment)

                settlements.append(settlement_record)
                bank_transactions.append(bank_record)
                ground_truth[order_id] = {
                    "expected_decision": "DUPLICATE",
                    "expected_match_ids": [payment_id, f"{payment_id}_dup"],
                    "expected_reason_code": "DUPLICATE_GATEWAY_CAPTURE",
                    "expected_variance_minor": gross_paise,
                    "is_auto_resolvable": False,
                    "honest_exception": True
                }

            elif scenario == FailureScenario.TIMING_DELAY:
                orders.append(order_record)
                payments.append(payment_record)
                settlements.append(settlement_record)
                # Bank delayed by 6 days instead of 2
                delayed_bank = dict(bank_record)
                delayed_bank["transaction_date"] = (tx_time + timedelta(days=7)).isoformat()
                bank_transactions.append(delayed_bank)
                ground_truth[order_id] = {
                    "expected_decision": "TIMING_VARIANCE",
                    "expected_match_ids": [payment_id, settlement_id, bank_id],
                    "expected_reason_code": "HOLIDAY_SETTLEMENT_DELAY",
                    "expected_variance_minor": 0,
                    "is_auto_resolvable": True,
                    "honest_exception": False
                }

            elif scenario == FailureScenario.AMBIGUOUS_CANDIDATE:
                orders.append(order_record)
                payments.append(payment_record)
                settlements.append(settlement_record)
                # Add competing settlement with exact same net amount
                competing_settlement = dict(settlement_record)
                competing_settlement["settlement_id"] = f"{settlement_id}_alt"
                competing_settlement["utr"] = f"UTR_ALT_{idx_str}"
                settlements.append(competing_settlement)
                bank_transactions.append(bank_record)
                ground_truth[order_id] = {
                    "expected_decision": "AMBIGUOUS_MATCH",
                    "expected_match_ids": [payment_id, settlement_id, f"{settlement_id}_alt"],
                    "expected_reason_code": "MULTIPLE_CANDIDATE_SETTLEMENTS",
                    "expected_variance_minor": 0,
                    "is_auto_resolvable": False,
                    "honest_exception": True
                }

            elif scenario == FailureScenario.UNKNOWN_PAYMENT:
                # Payment captured at gateway with orphan order
                orphan_payment = dict(payment_record)
                orphan_payment["order_id"] = f"ORD-UNKNOWN-{idx_str}"
                payments.append(orphan_payment)
                settlements.append(settlement_record)
                bank_transactions.append(bank_record)
                ground_truth[order_id] = {
                    "expected_decision": "MISSING_ORDER",
                    "expected_match_ids": [payment_id],
                    "expected_reason_code": "ORPHAN_GATEWAY_PAYMENT",
                    "expected_variance_minor": gross_paise,
                    "is_auto_resolvable": False,
                    "honest_exception": True
                }

        return {
            "metadata": {
                "records_count": record_count,
                "clean_count": clean_count,
                "anomaly_count": anomaly_count,
                "anomaly_rate": anomaly_rate,
                "generated_at": datetime.now(timezone.utc).isoformat()
            },
            "orders": orders,
            "payments": payments,
            "settlements": settlements,
            "bank_transactions": bank_transactions,
            "refunds": refunds,
            "adjustments": adjustments,
            "ground_truth": ground_truth
        }
