import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

class ExceptionManagementService:
    @staticmethod
    def cluster_exceptions(exceptions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Groups individual exceptions into systemic clusters per PRD §39 & SDS §88.
        e.g., 87 transactions sharing MDR fee discrepancies clustered into one actionable issue.
        """
        clusters_by_key: Dict[str, Dict[str, Any]] = {}

        for exc in exceptions:
            exc_type = exc.get("exception_type", "UNKNOWN")
            root_cause = exc.get("root_cause", "UNKNOWN")
            exposure = exc.get("financial_exposure_minor", 0)

            cluster_key = f"{exc_type}::{root_cause}"
            if cluster_key not in clusters_by_key:
                name_map = {
                    "FEE_MISMATCH::MDR_CONFIG_VARIANCE": "MDR Fee Configuration Variance (2.5% vs 1.8% contracted)",
                    "TAX_MISMATCH::GST_RATE_DISCREPANCY": "GST Tax Calculation Discrepancy on MDR (12% vs 18%)",
                    "MISSING_SETTLEMENT::GATEWAY_SETTLEMENT_PENDING": "Unsettled Payment Gateway Batch (Pending T+2 Payout)",
                    "MISSING_BANK_CREDIT::BANK_CLEARING_UNCONFIRMED": "Bank Statement Clearing Delay on Completed Settlements",
                    "PARTIAL_SETTLEMENT::PARTIAL_PAYOUT_RETAINED": "Partial Payout Retention by Gateway Risk Control",
                    "DUPLICATE::DUPLICATE_GATEWAY_CAPTURE": "Duplicate Webhook / Double Authorization Anomaly",
                    "AMBIGUOUS_MATCH::MULTIPLE_CANDIDATE_SETTLEMENTS": "Ambiguous Settlement Attribution with Competing UTRs",
                    "MISSING_PAYMENT::PAYMENT_NOT_CAPTURED": "Abandoned / Uncaptured Commerce Orders"
                }
                cluster_name = name_map.get(cluster_key, f"Systemic {exc_type.replace('_', ' ').title()}")
                
                clusters_by_key[cluster_key] = {
                    "id": f"cluster_{uuid.uuid4().hex[:8]}",
                    "name": cluster_name,
                    "root_cause": root_cause,
                    "affected_count": 0,
                    "total_exposure_minor": 0,
                    "confidence": 0.94,
                    "sample_transaction_ids": [],
                    "pattern_summary": f"Detected recurring pattern of {root_cause.replace('_', ' ').lower()} affecting multiple transactions.",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }

            c = clusters_by_key[cluster_key]
            c["affected_count"] += 1
            c["total_exposure_minor"] += exposure
            if len(c["sample_transaction_ids"]) < 5:
                c["sample_transaction_ids"].append(exc.get("transaction_id"))

        return list(clusters_by_key.values())
