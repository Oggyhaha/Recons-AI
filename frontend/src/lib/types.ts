export interface ReconciliationRun {
  run_id: string;
  rule_version: string;
  engine_version: string;
  status: string;
  total_records: number;
  matched_count: number;
  exception_count: number;
  unresolved_count: number;
  match_rate: number;
  duration_sec: number;
  throughput_rps: number;
}

export interface ReconciliationResult {
  id: string;
  entity_type: string;
  entity_id: string;
  decision: string;
  confidence: number;
  expected_amount_minor: number;
  actual_amount_minor: number;
  variance_minor: number;
  reason_code?: string;
  explanation: {
    summary?: string;
    score_breakdown?: {
      id_score: number;
      amount_score: number;
      time_score: number;
      ref_score: number;
      meta_score: number;
    };
    calculation?: Record<string, any>;
    days_elapsed?: number;
    candidates?: string[];
  };
  matched_record_ids: string[];
}

export interface ExceptionRecord {
  transaction_id: string;
  exception_type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "INVESTIGATING" | "WAITING_HUMAN" | "RESOLVED" | "REJECTED";
  financial_exposure_minor: number;
  root_cause: string;
  confidence: number;
  explanation?: Record<string, any>;
  matched_record_ids: string[];
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
}

export interface ExceptionCluster {
  id: string;
  name: string;
  root_cause: string;
  affected_count: number;
  total_exposure_minor: number;
  confidence: number;
  sample_transaction_ids: string[];
  pattern_summary: string;
}

export interface CashPosition {
  available_minor: number;
  expected_settlements_minor: number;
  pending_refunds_minor: number;
  at_risk_minor: number;
  projected_minor: number;
  currency: string;
  snapshot_date: string;
  formatted_available: string;
  formatted_expected: string;
  formatted_projected: string;
  formatted_at_risk: string;
}

export interface CashForecastDriver {
  name: string;
  impact_minor: number;
  type: "INFLOW" | "OUTFLOW" | "VARIANCE";
  description: string;
}

export interface CashForecastDay {
  date: string;
  day_label: string;
  projected_minor: number;
  projected_inr: number;
  lower_bound_inr: number;
  upper_bound_inr: number;
}

export interface CashForecast {
  forecast_date: string;
  horizon_days: number;
  projected_amount_minor: number;
  lower_bound_minor: number;
  upper_bound_minor: number;
  confidence: number;
  drivers: CashForecastDriver[];
  timeline: CashForecastDay[];
}

export interface AgentStep {
  step_number: number;
  step_type: string;
  tool_name: string;
  tool_input: Record<string, any>;
  tool_output: Record<string, any>;
  latency_ms: number;
}

export interface AgentInvestigationOutput {
  finding: string;
  evidence_ids: string[];
  confidence: number;
  root_cause: string;
  financial_impact_minor: number;
  recommended_action: string;
  requires_human_review: boolean;
  calculation_summary: Record<string, any>;
  policy_citations: string[];
}

export interface AgentInvestigation {
  run_id: string;
  exception_id: string;
  output: AgentInvestigationOutput;
  steps: AgentStep[];
  started_at: string;
}

export interface BenchmarkComparisonRow {
  metric: string;
  rules_only: string;
  reconos_hybrid: string;
  uplift: string;
}

export interface HonestExceptionItem {
  transaction_id: string;
  amount_inr: string;
  reason_code: string;
  explanation: string;
  ai_status: string;
}

export interface EvaluationReport {
  dataset_name: string;
  total_records: number;
  matched_records: number;
  accuracy_percentage: number;
  precision_percentage: number;
  recall_percentage: number;
  f1_percentage: number;
  auto_resolution_rate: number;
  value_weighted_accuracy: number;
  total_value_processed_inr: string;
  reconciled_value_inr: string;
  unresolved_value_inr: string;
  cash_at_risk_inr: string;
  throughput_rps: number;
  comparison_table: BenchmarkComparisonRow[];
  honest_exception_list: HonestExceptionItem[];
}

export interface AuditEvent {
  id: string;
  actor_type: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_state: Record<string, any>;
  after_state: Record<string, any>;
  reason: string;
  correlation_id: string;
  tamper_hash: string;
  created_at: string;
}

export interface ImportStatus {
  dataset_name: string;
  records_count: number;
  clean_count: number;
  anomaly_count: number;
  anomaly_rate: number;
  sources: Array<{
    source_type: string;
    rows: number;
    status: string;
  }>;
}

export interface DisputePackage {
  dispute_reference: string;
  transaction_id: string;
  created_at: string;
  merchant_id: string;
  root_cause: string;
  severity: string;
  gross_amount_minor: number;
  claimed_overcharge_minor: number;
  formatted_gross: string;
  formatted_claim: string;
  formal_memo: string;
  csv_evidence: string;
}

export interface JournalEntryLine {
  line_no: number;
  account_code: string;
  account_name: string;
  type: "DEBIT" | "CREDIT";
  amount_paise: number;
  formatted_amount: string;
  narration: string;
}

export interface JournalExport {
  voucher_no: string;
  voucher_date: string;
  run_id: string;
  currency: string;
  is_balanced: boolean;
  total_debit_paise: number;
  total_credit_paise: number;
  formatted_total_debit: string;
  formatted_total_credit: string;
  lines: JournalEntryLine[];
  csv_export: string;
  tally_xml_export: string;
}

export interface SampleTemplate {
  key: string;
  filename: string;
  description: string;
}

export interface WebhookLog {
  event_id: string;
  event: string;
  signature_verified: boolean;
  received_at: string;
  entity_id: string;
  amount_paise: number;
  formatted_amount: string;
  status: string;
}
