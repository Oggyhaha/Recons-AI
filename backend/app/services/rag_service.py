from typing import List, Dict, Any

class PolicyRAGService:
    """
    RAG repository containing authoritative settlement policies, SOPs,
    and historical verified exception resolutions per PRD §30 & SDS §38.
    """
    def __init__(self):
        self._knowledge_base: List[Dict[str, Any]] = [
            {
                "policy_id": "POL-RZP-SETTLE-01",
                "title": "Razorpay Standard Settlement Cycle & Holiday Calendar Policy",
                "keywords": ["settlement", "timing", "t+2", "working day", "holiday", "delay"],
                "content": (
                    "Standard domestic payouts are settled on a T+2 working-day schedule. "
                    "Transactions captured on non-working days or bank holidays will be processed "
                    "on the next available NEFT/RTGS settlement window. Timing variances within 5 days "
                    "with matching UTRs are considered valid business exceptions and may be reconciled."
                )
            },
            {
                "policy_id": "POL-RZP-FEE-02",
                "title": "Merchant Discount Rate (MDR) & Fee Schedule v2026",
                "keywords": ["fee", "mdr", "percentage", "commission", "rate", "contract"],
                "content": (
                    "Standard merchant contract MDR is 1.80% for domestic UPI and cards, plus a fixed "
                    "₹3.00 gateway processing fee per transaction. Enterprise rate overrides must be backed "
                    "by an active addendum. Any fee deduction exceeding 1.8% + ₹3.00 constitutes a fee mismatch."
                )
            },
            {
                "policy_id": "POL-RZP-TAX-03",
                "title": "Goods & Services Tax (GST) Treatment on Processing Fees",
                "keywords": ["tax", "gst", "18%", "invoice", "igst", "cgst"],
                "content": (
                    "GST is strictly applicable at 18% levied exclusively on gateway processing fees and MDR. "
                    "GST is never levied on gross transaction principle. Deductions deviating from 18% on fee "
                    "must be flagged as TAX_MISMATCH and reconciled against monthly gateway tax invoices."
                )
            },
            {
                "policy_id": "POL-RZP-PARTIAL-04",
                "title": "Partial Settlement & Risk Retention Guidelines",
                "keywords": ["partial", "retention", "risk", "withheld", "reserve"],
                "content": (
                    "In the event of high-volume surges or rolling reserve requirements, Razorpay may retain "
                    "up to 30% of a settlement batch. Such balances remain recorded as pending receivables and "
                    "require Finance Controller approval before closing the operational ledger."
                )
            },
            {
                "policy_id": "POL-RZP-REFUND-05",
                "title": "Refund Offsetting & Settlement Deductions SOP",
                "keywords": ["refund", "reversal", "offset", "customer refund", "chargeback"],
                "content": (
                    "Customer refunds processed prior to the daily settlement cutoff are automatically deducted "
                    "from gross payouts. The net settlement will equal Gross - Fees - Taxes - Refunds. Reconcile "
                    "by linking the refund ID to the parent payment authorization."
                )
            }
        ]

    def search_policies(self, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        query_words = set(query.lower().split())
        scored_policies = []

        for p in self._knowledge_base:
            keywords = set(p["keywords"])
            overlap = len(query_words.intersection(keywords))
            # Also check content text
            content_lower = p["content"].lower()
            text_matches = sum(1 for w in query_words if w in content_lower)
            score = overlap * 2 + text_matches
            if score > 0:
                scored_policies.append((score, p))

        scored_policies.sort(key=lambda x: x[0], reverse=True)
        return [p for _, p in scored_policies[:top_k]]
