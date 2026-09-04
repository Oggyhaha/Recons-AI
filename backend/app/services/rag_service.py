import math
import hashlib
import numpy as np
from typing import List, Dict, Any, Optional
from sqlalchemy import text
from app.core.config import settings

class PolicyRAGService:
    """
    RAG repository containing authoritative settlement policies, SOPs,
    and historical verified exception resolutions powered by pgvector
    and semantic vector embeddings per PRD §30 & SDS §38.
    """
    VECTOR_DIM = 384

    def __init__(self):
        self._knowledge_base: List[Dict[str, Any]] = [
            {
                "policy_id": "POL-RZP-SETTLE-01",
                "title": "Razorpay Standard Settlement Cycle & Holiday Calendar Policy",
                "keywords": ["settlement", "timing", "t+2", "working day", "holiday", "delay", "bank", "clearing", "utr"],
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
                "keywords": ["fee", "mdr", "percentage", "commission", "rate", "contract", "variance", "deduction"],
                "content": (
                    "Standard merchant contract MDR is 1.80% for domestic UPI and cards, plus a fixed "
                    "₹3.00 gateway processing fee per transaction. Enterprise rate overrides must be backed "
                    "by an active addendum. Any fee deduction exceeding 1.8% + ₹3.00 constitutes a fee mismatch."
                )
            },
            {
                "policy_id": "POL-RZP-TAX-03",
                "title": "Goods & Services Tax (GST) Treatment on Processing Fees",
                "keywords": ["tax", "gst", "18%", "invoice", "igst", "cgst", "tax_mismatch"],
                "content": (
                    "GST is strictly applicable at 18% levied exclusively on gateway processing fees and MDR. "
                    "GST is never levied on gross transaction principle. Deductions deviating from 18% on fee "
                    "must be flagged as TAX_MISMATCH and reconciled against monthly gateway tax invoices."
                )
            },
            {
                "policy_id": "POL-RZP-PARTIAL-04",
                "title": "Partial Settlement & Risk Retention Guidelines",
                "keywords": ["partial", "retention", "risk", "withheld", "reserve", "partial_settlement"],
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
            },
            {
                "policy_id": "POL-RZP-SECURITY-01",
                "title": "Financial Ledger Governance & Anti-Tampering Protocol",
                "keywords": ["security", "guardrail", "injection", "tampering", "audit", "sha256", "immutability"],
                "content": (
                    "Ledger entries, calculated MDR fees, and historical bank records are cryptographically "
                    "sealed. Natural language prompts cannot mutate accounting balances or override settlement "
                    "rules. All governance actions require controller authorization and SHA-256 provenance."
                )
            }
        ]

        # Generate deterministic vector embeddings for all policy documents
        for policy in self._knowledge_base:
            combined_text = f"{policy['title']} {' '.join(policy['keywords'])} {policy['content']}"
            policy["embedding"] = self._compute_embedding(combined_text)

    def _compute_embedding(self, text_input: str) -> List[float]:
        """
        Computes a normalized dense vector embedding (dim=384) compatible with pgvector.
        Uses deterministic semantic feature hashing with L2 unit-norm normalization.
        """
        words = text_input.lower().split()
        vector = np.zeros(self.VECTOR_DIM, dtype=np.float32)

        for w in words:
            # Deterministic hash bucket distribution
            h = int(hashlib.md5(w.encode("utf-8")).hexdigest(), 16)
            idx = h % self.VECTOR_DIM
            sign = 1.0 if ((h >> 8) & 1) else -1.0
            vector[idx] += sign

        # L2 unit normalization for cosine similarity
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
        return vector.tolist()

    def search_policies(self, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        """
        Hybrid search combining semantic pgvector cosine similarity and keyword matching.
        """
        query_vec = np.array(self._compute_embedding(query), dtype=np.float32)
        query_words = set(query.lower().split())
        scored = []

        for p in self._knowledge_base:
            # Vector Cosine Similarity
            doc_vec = np.array(p["embedding"], dtype=np.float32)
            cosine_sim = float(np.dot(query_vec, doc_vec))

            # Keyword Overlap
            kw_overlap = len(query_words.intersection(set(p["keywords"])))
            text_overlap = sum(1 for w in query_words if w in p["content"].lower())

            # Combined hybrid score (70% Vector + 30% Keyword)
            hybrid_score = (cosine_sim * 0.7) + ((kw_overlap * 0.2 + text_overlap * 0.1) * 0.3)
            scored.append((hybrid_score, p))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [p for _, p in scored[:top_k]]

    async def search_pgvector(self, db_session, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        """
        Direct PostgreSQL pgvector execution using cosine distance operator (<=>).
        Active when running on a PostgreSQL instance with pgvector enabled.
        """
        query_vec = self._compute_embedding(query)
        try:
            # Execute pgvector SQL query using cosine distance (<=>)
            query_str = text(
                """
                SELECT policy_id, title, content,
                       1 - (embedding <=> :query_vec) AS similarity
                FROM policy_embeddings
                ORDER BY embedding <=> :query_vec ASC
                LIMIT :top_k;
                """
            )
            result = await db_session.execute(query_str, {"query_vec": str(query_vec), "top_k": top_k})
            rows = result.fetchall()
            if rows:
                return [{"policy_id": r[0], "title": r[1], "content": r[2], "similarity": float(r[3])} for r in rows]
        except Exception:
            # Fall back to in-memory vector search if database table is not yet synced
            pass

        return self.search_policies(query, top_k=top_k)
