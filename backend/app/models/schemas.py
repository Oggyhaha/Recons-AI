from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

# Tenant & Auth Schemas
class TenantBase(BaseModel):
    name: str
    slug: str
    default_currency: str = "INR"

class TenantOut(TenantBase):
    id: str
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    email: str
    name: str
    role: str = "FINANCE_CONTROLLER"

class UserOut(UserBase):
    id: str
    tenant_id: str
    status: str
    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    email: str
    role: Optional[str] = "FINANCE_CONTROLLER"

# Source File Data Ingestion Models
class OrderRow(BaseModel):
    order_id: str
    customer_id: Optional[str] = None
    order_date: str
    currency: str = "INR"
    gross_amount: float
    payment_status: Optional[str] = "PAID"

class PaymentRow(BaseModel):
    payment_id: str
    order_id: Optional[str] = None
    gateway_reference: Optional[str] = None
    payment_date: str
    gross_amount: float
    fee: float = 0.0
    tax: float = 0.0
    net_amount: Optional[float] = None
    status: str = "CAPTURED"
    settlement_id: Optional[str] = None

class SettlementRow(BaseModel):
    settlement_id: str
    settlement_date: str
    gross_amount: float
    fee: float = 0.0
    tax: float = 0.0
    adjustment: float = 0.0
    refund: float = 0.0
    net_amount: float
    status: str = "SETTLED"

class BankRow(BaseModel):
    bank_transaction_id: str
    transaction_date: str
    credit: float = 0.0
    debit: float = 0.0
    utr: Optional[str] = None
    description: Optional[str] = None

class RefundRow(BaseModel):
    refund_id: str
    payment_id: str
    amount: float
    date: str
    status: str = "PROCESSED"

# FinSim Generation Request
class FinSimGenerateRequest(BaseModel):
    records_count: int = Field(default=500, ge=50, le=50000)
    anomaly_rate: float = Field(default=0.15, ge=0.0, le=0.6)
    dataset_name: str = "FinSim-Production-Batch"

# Canonical Financial Event Schema
class FinancialEventSchema(BaseModel):
    event_id: str
    event_type: str
    entity_type: str
    entity_id: str
    amount_minor: int
    currency: str = "INR"
    occurred_at: datetime
    status: str
    metadata: Dict[str, Any] = {}

# Reconciliation Schemas
class ReconciliationRunRequest(BaseModel):
    run_type: str = "BATCH"
    rule_version: str = "v1.0"
    engine_version: str = "1.0.0"

class ReconciliationResultOut(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    decision: str
    confidence: float
    expected_amount_minor: int
    actual_amount_minor: int
    variance_minor: int
    reason_code: Optional[str] = None
    explanation: Dict[str, Any] = {}
    matched_record_ids: List[str] = []
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ReconciliationRunOut(BaseModel):
    id: str
    run_type: str
    rule_version: str
    engine_version: str
    status: str
    input_record_count: int
    matched_count: int
    exception_count: int
    unresolved_count: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    metrics: Dict[str, Any] = {}
    model_config = ConfigDict(from_attributes=True)

# Exception & Investigation Schemas
class ExceptionEvidenceOut(BaseModel):
    id: str
    evidence_type: str
    source_entity_type: Optional[str] = None
    source_entity_id: Optional[str] = None
    description: str
    data: Dict[str, Any] = {}
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ExceptionRecordOut(BaseModel):
    id: str
    reconciliation_result_id: Optional[str] = None
    transaction_id: str
    exception_type: str
    severity: str
    status: str
    financial_exposure_minor: int
    root_cause: Optional[str] = None
    confidence: float
    cluster_id: Optional[str] = None
    assigned_to: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class ExceptionClusterOut(BaseModel):
    id: str
    name: str
    root_cause: str
    affected_count: int
    total_exposure_minor: int
    confidence: float
    pattern_summary: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class HumanApprovalRequest(BaseModel):
    action: str  # APPROVE, REJECT, REQUEST_REVIEW, MARK_FALSE_POSITIVE
    notes: Optional[str] = None
    actor_id: str = "FINANCE_CONTROLLER"

# AI Agent Output Contract (PRD §28 & SDS §41)
class AgentInvestigationOutput(BaseModel):
    finding: str
    evidence_ids: List[str]
    confidence: float
    root_cause: str
    financial_impact_minor: int
    recommended_action: str  # RESOLVE, HUMAN_REVIEW, UNRESOLVED, ESCALATE
    requires_human_review: bool
    calculation_summary: Dict[str, Any] = {}
    policy_citations: List[str] = []

class AgentStepOut(BaseModel):
    step_number: int
    step_type: str
    tool_name: Optional[str] = None
    tool_input: Dict[str, Any] = {}
    tool_output: Dict[str, Any] = {}
    latency_ms: int
    model_config = ConfigDict(from_attributes=True)

class AgentRunOut(BaseModel):
    id: str
    exception_id: Optional[str] = None
    agent_type: str
    model: str
    status: str
    final_decision: Optional[str] = None
    confidence: float
    summary: Optional[str] = None
    steps: List[AgentStepOut] = []
    started_at: datetime
    completed_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

# Cash & Forecast Schemas
class CashPositionOut(BaseModel):
    available_minor: int
    expected_settlements_minor: int
    pending_refunds_minor: int
    at_risk_minor: int
    projected_minor: int
    currency: str = "INR"
    snapshot_date: datetime
    formatted_available: str
    formatted_expected: str
    formatted_projected: str
    formatted_at_risk: str

class CashForecastDriver(BaseModel):
    name: str
    impact_minor: int
    type: str  # INFLOW, OUTFLOW, VARIANCE
    description: str

class CashForecastOut(BaseModel):
    forecast_date: datetime
    horizon_days: int
    projected_amount_minor: int
    lower_bound_minor: int
    upper_bound_minor: int
    confidence: float
    drivers: List[CashForecastDriver] = []
    timeline: List[Dict[str, Any]] = []

# Finance Copilot Q&A Schema
class CopilotQueryRequest(BaseModel):
    query: str
    session_id: Optional[str] = None

class CopilotQueryResponse(BaseModel):
    answer: str
    confidence: float
    sources: List[str] = []
    tools_used: List[str] = []
    financial_facts: Dict[str, Any] = {}
    suggested_followups: List[str] = []

# Evaluation & Benchmark Schemas
class BenchmarkComparisonRow(BaseModel):
    metric: str
    rules_only: str
    reconos_hybrid: str
    uplift: str

class HonestExceptionItem(BaseModel):
    transaction_id: str
    amount_inr: str
    reason_code: str
    explanation: str
    ai_status: str

class EvaluationReportOut(BaseModel):
    dataset_name: str
    total_records: int
    matched_records: int
    accuracy_percentage: float
    precision_percentage: float
    recall_percentage: float
    f1_percentage: float
    auto_resolution_rate: float
    value_weighted_accuracy: float
    total_value_processed_inr: str
    reconciled_value_inr: str
    unresolved_value_inr: str
    cash_at_risk_inr: str
    throughput_rps: float
    comparison_table: List[BenchmarkComparisonRow]
    honest_exception_list: List[HonestExceptionItem]
