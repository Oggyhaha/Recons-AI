import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, BigInteger, Boolean, DateTime,
    ForeignKey, Text, JSON, Float, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    status = Column(String(50), default="ACTIVE")
    default_currency = Column(String(10), default="INR")
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    email = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(50), default="FINANCE_CONTROLLER")  # ADMIN, FINANCE_CONTROLLER, FINANCE_ANALYST, AUDITOR
    status = Column(String(50), default="ACTIVE")
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    __table_args__ = (UniqueConstraint("tenant_id", "email", name="uq_tenant_user_email"),)

class Source(Base):
    __tablename__ = "sources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    name = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False)  # ORDER_SYSTEM, PAYMENT_GATEWAY, SETTLEMENT_SYSTEM, BANK, REFUND_SYSTEM
    status = Column(String(50), default="ACTIVE")
    configuration = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

class ImportBatch(Base):
    __tablename__ = "import_batches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    source_id = Column(String(36), ForeignKey("sources.id"), nullable=True)
    file_name = Column(String(255), nullable=False)
    checksum_sha256 = Column(String(64), nullable=True)
    status = Column(String(50), default="UPLOADED")  # UPLOADED, VALIDATING, VALIDATED, PROCESSED, FAILED
    row_count = Column(Integer, default=0)
    valid_count = Column(Integer, default=0)
    invalid_count = Column(Integer, default=0)
    started_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)

class RawRecord(Base):
    __tablename__ = "raw_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    import_id = Column(String(36), ForeignKey("import_batches.id"), nullable=False)
    source_record_id = Column(String(255), nullable=False)
    record_hash = Column(String(64), nullable=True)
    payload = Column(JSON, nullable=False)
    ingested_at = Column(DateTime, default=utc_now)

class FinancialEvent(Base):
    __tablename__ = "financial_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    event_type = Column(String(50), nullable=False)  # ORDER_CREATED, PAYMENT_CAPTURED, SETTLEMENT_CREATED, BANK_CREDIT, REFUND_PROCESSED
    source_id = Column(String(36), nullable=True)
    source_record_id = Column(String(255), nullable=True)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(255), nullable=False)
    amount_minor = Column(BigInteger, nullable=False)  # in paise
    currency = Column(String(10), default="INR")
    occurred_at = Column(DateTime, nullable=False)
    effective_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="RECORDED")
    event_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)

# Domain Specific Canonical Records
class OrderRecord(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    external_order_id = Column(String(255), nullable=False)
    customer_reference = Column(String(255), nullable=True)
    gross_amount_minor = Column(BigInteger, nullable=False)  # in paise
    currency = Column(String(10), default="INR")
    status = Column(String(50), default="CREATED")
    created_at = Column(DateTime, default=utc_now)

class PaymentRecord(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    external_payment_id = Column(String(255), nullable=False)
    order_id = Column(String(255), nullable=True)
    amount_minor = Column(BigInteger, nullable=False)  # in paise
    fee_minor = Column(BigInteger, default=0)
    tax_minor = Column(BigInteger, default=0)
    currency = Column(String(10), default="INR")
    status = Column(String(50), default="CAPTURED")
    payment_method = Column(String(50), default="UPI")
    captured_at = Column(DateTime, default=utc_now)
    payment_metadata = Column(JSON, default=dict)

class SettlementRecord(Base):
    __tablename__ = "settlements"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    external_settlement_id = Column(String(255), nullable=False)
    settlement_date = Column(DateTime, nullable=False)
    settlement_status = Column(String(50), default="SETTLED")
    gross_amount_minor = Column(BigInteger, nullable=False)
    fee_minor = Column(BigInteger, default=0)
    tax_minor = Column(BigInteger, default=0)
    adjustment_minor = Column(BigInteger, default=0)
    transfer_minor = Column(BigInteger, default=0)
    refund_minor = Column(BigInteger, default=0)
    net_amount_minor = Column(BigInteger, nullable=False)
    currency = Column(String(10), default="INR")
    settlement_metadata = Column(JSON, default=dict)

class BankTransactionRecord(Base):
    __tablename__ = "bank_transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    external_transaction_id = Column(String(255), nullable=False)
    transaction_date = Column(DateTime, nullable=False)
    value_date = Column(DateTime, nullable=True)
    amount_minor = Column(BigInteger, nullable=False)
    currency = Column(String(10), default="INR")
    direction = Column(String(20), default="CREDIT")  # CREDIT / DEBIT
    bank_reference = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="POSTED")

class RefundRecord(Base):
    __tablename__ = "refunds"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    external_refund_id = Column(String(255), nullable=False)
    payment_id = Column(String(255), nullable=True)
    amount_minor = Column(BigInteger, nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(String(50), default="PROCESSED")
    initiated_at = Column(DateTime, default=utc_now)
    processed_at = Column(DateTime, nullable=True)

# Reconciliation Runs and Results
class ReconciliationRun(Base):
    __tablename__ = "reconciliation_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    run_type = Column(String(50), default="BATCH")  # BATCH, REALTIME, BENCHMARK
    rule_version = Column(String(50), default="v1.0")
    engine_version = Column(String(50), default="1.0.0")
    status = Column(String(50), default="RUNNING")  # RUNNING, COMPLETED, FAILED
    input_record_count = Column(Integer, default=0)
    matched_count = Column(Integer, default=0)
    exception_count = Column(Integer, default=0)
    unresolved_count = Column(Integer, default=0)
    started_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)
    metrics = Column(JSON, default=dict)

class ReconciliationResult(Base):
    __tablename__ = "reconciliation_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    run_id = Column(String(36), ForeignKey("reconciliation_runs.id"), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(255), nullable=False)
    decision = Column(String(50), nullable=False)  # MATCHED, PARTIAL_MATCH, AMOUNT_MISMATCH, etc.
    confidence = Column(Float, default=1.0)
    expected_amount_minor = Column(BigInteger, default=0)
    actual_amount_minor = Column(BigInteger, default=0)
    variance_minor = Column(BigInteger, default=0)
    reason_code = Column(String(100), nullable=True)
    rule_version = Column(String(50), default="v1.0")
    explanation = Column(JSON, default=dict)
    matched_record_ids = Column(JSON, default=list)
    created_at = Column(DateTime, default=utc_now)

class MatchCandidate(Base):
    __tablename__ = "match_candidates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    reconciliation_result_id = Column(String(36), ForeignKey("reconciliation_results.id"), nullable=False)
    candidate_entity_type = Column(String(50), nullable=False)
    candidate_entity_id = Column(String(255), nullable=False)
    score = Column(Float, nullable=False)
    id_score = Column(Float, default=0.0)
    amount_score = Column(Float, default=0.0)
    time_score = Column(Float, default=0.0)
    reference_score = Column(Float, default=0.0)
    merchant_score = Column(Float, default=0.0)
    explanation = Column(JSON, default=dict)

# Exception Tracking & Clustering
class ExceptionCluster(Base):
    __tablename__ = "exception_clusters"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    name = Column(String(255), nullable=False)
    root_cause = Column(String(100), nullable=False)
    affected_count = Column(Integer, default=0)
    total_exposure_minor = Column(BigInteger, default=0)
    confidence = Column(Float, default=0.90)
    pattern_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

class ExceptionRecord(Base):
    __tablename__ = "exceptions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    reconciliation_result_id = Column(String(36), ForeignKey("reconciliation_results.id"), nullable=True)
    transaction_id = Column(String(255), nullable=False)
    exception_type = Column(String(50), nullable=False)  # AMOUNT_MISMATCH, MISSING_SETTLEMENT, etc.
    severity = Column(String(20), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(50), default="OPEN")  # OPEN, INVESTIGATING, WAITING_HUMAN, RESOLVED, REJECTED, UNRESOLVED
    financial_exposure_minor = Column(BigInteger, default=0)
    root_cause = Column(String(100), nullable=True)
    confidence = Column(Float, default=0.0)
    cluster_id = Column(String(36), ForeignKey("exception_clusters.id"), nullable=True)
    assigned_to = Column(String(255), nullable=True)
    sla_due_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    resolved_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    resolved_at = Column(DateTime, nullable=True)

class ExceptionEvidence(Base):
    __tablename__ = "exception_evidence"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    exception_id = Column(String(36), ForeignKey("exceptions.id"), nullable=False)
    evidence_type = Column(String(50), nullable=False)  # TRANSACTION, CALCULATION, POLICY, TIMELINE, HISTORICAL_CASE
    source_entity_type = Column(String(50), nullable=True)
    source_entity_id = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    data = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)

# AI Agent Traces
class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    exception_id = Column(String(36), ForeignKey("exceptions.id"), nullable=True)
    agent_type = Column(String(50), default="INVESTIGATOR")
    model = Column(String(100), default="gemini-flash-hybrid")
    model_version = Column(String(50), default="v1.0")
    prompt_version = Column(String(50), default="v1.0")
    status = Column(String(50), default="COMPLETED")
    final_decision = Column(String(50), nullable=True)
    confidence = Column(Float, default=0.0)
    summary = Column(Text, nullable=True)
    started_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)

class AgentStep(Base):
    __tablename__ = "agent_steps"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agent_run_id = Column(String(36), ForeignKey("agent_runs.id"), nullable=False)
    step_number = Column(Integer, nullable=False)
    step_type = Column(String(50), default="TOOL_CALL")  # TOOL_CALL, REASONING, OUTPUT
    tool_name = Column(String(100), nullable=True)
    tool_input = Column(JSON, default=dict)
    tool_output = Column(JSON, default=dict)
    latency_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)

# Audit Events
class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    actor_type = Column(String(50), default="SYSTEM")  # USER, SYSTEM, AGENT, WORKER
    actor_id = Column(String(255), default="reconos-core")
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(255), nullable=False)
    before_state = Column(JSON, nullable=True)
    after_state = Column(JSON, nullable=True)
    reason = Column(Text, nullable=True)
    correlation_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now)

# Cash Positions & Forecasts
class CashPosition(Base):
    __tablename__ = "cash_positions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    snapshot_date = Column(DateTime, default=utc_now)
    available_minor = Column(BigInteger, default=0)
    expected_settlements_minor = Column(BigInteger, default=0)
    pending_refunds_minor = Column(BigInteger, default=0)
    at_risk_minor = Column(BigInteger, default=0)
    projected_minor = Column(BigInteger, default=0)
    currency = Column(String(10), default="INR")
    created_at = Column(DateTime, default=utc_now)

class CashForecast(Base):
    __tablename__ = "cash_forecasts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    forecast_date = Column(DateTime, default=utc_now)
    horizon_days = Column(Integer, default=7)
    projected_amount_minor = Column(BigInteger, default=0)
    lower_bound_minor = Column(BigInteger, default=0)
    upper_bound_minor = Column(BigInteger, default=0)
    confidence = Column(Float, default=0.85)
    drivers = Column(JSON, default=list)
    created_at = Column(DateTime, default=utc_now)

# Evaluation Runs and Ground Truth
class EvaluationRun(Base):
    __tablename__ = "evaluation_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    reconciliation_run_id = Column(String(36), ForeignKey("reconciliation_runs.id"), nullable=True)
    dataset_name = Column(String(255), default="FinSim-Standard-Batch")
    total_records = Column(Integer, default=0)
    matched_records = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0)
    precision = Column(Float, default=0.0)
    recall = Column(Float, default=0.0)
    f1 = Column(Float, default=0.0)
    auto_resolution_rate = Column(Float, default=0.0)
    value_at_risk_minor = Column(BigInteger, default=0)
    throughput_rps = Column(Float, default=0.0)
    metrics_summary = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)

class GroundTruthRecord(Base):
    __tablename__ = "ground_truth_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    evaluation_run_id = Column(String(36), ForeignKey("evaluation_runs.id"), nullable=False)
    entity_id = Column(String(255), nullable=False)
    expected_decision = Column(String(50), nullable=False)
    expected_match_ids = Column(JSON, default=list)
    expected_amount_minor = Column(BigInteger, default=0)
    expected_reason_code = Column(String(100), nullable=True)

# Policies and RAG
class Policy(Base):
    __tablename__ = "policies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    name = Column(String(255), nullable=False)
    policy_type = Column(String(50), nullable=False)  # SETTLEMENT_WINDOW, FEE_STRUCTURE, TAX_RULES, REFUND_SOP
    description = Column(Text, nullable=True)
    configuration = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)
