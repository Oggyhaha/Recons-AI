import {
  ReconciliationRun,
  ReconciliationResult,
  ExceptionRecord,
  ExceptionCluster,
  CashPosition,
  CashForecast,
  AgentInvestigation,
  EvaluationReport,
  AuditEvent,
  ImportStatus,
  DisputePackage,
  JournalExport,
  SampleTemplate,
  WebhookLog,
  UserProfile,
  AuthResponse
} from "./types";

const API_BASE = "/api/v1";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status} ${res.statusText}`;
    try {
      const err = await res.json();
      if (err.detail) errorMsg = err.detail;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Imports & File Ingestion
  getImportStatus: () => fetchJson<ImportStatus>(`${API_BASE}/imports/status`),
  generateBatch: (records_count: number = 500, anomaly_rate: number = 0.15) =>
    fetchJson<{ status: string; message: string; summary: any }>(
      `${API_BASE}/imports/generate-batch`,
      {
        method: "POST",
        body: JSON.stringify({ records_count, anomaly_rate }),
      }
    ),
  getSampleTemplates: () =>
    fetchJson<{ templates: SampleTemplate[] }>(`${API_BASE}/imports/sample-templates`),
  downloadSampleTemplateUrl: (type: string = "unified") =>
    `${API_BASE}/imports/sample-templates/download?type=${type}`,
  uploadCsv: async (file: File, sourceType: string = "AUTO_DETECT") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("source_type", sourceType);
    const res = await fetch(`${API_BASE}/imports/upload-csv`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      let errorMsg = `HTTP ${res.status} ${res.statusText}`;
      try {
        const err = await res.json();
        if (err.detail) errorMsg = err.detail;
      } catch {}
      throw new Error(errorMsg);
    }
    return res.json();
  },

  // Reconciliation
  getLatestRun: () => fetchJson<ReconciliationRun>(`${API_BASE}/reconciliation/runs/latest`),
  getResults: (decision?: string, limit: number = 50, offset: number = 0) => {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    if (decision && decision !== "ALL") params.append("decision", decision);
    return fetchJson<{ total: number; offset: number; limit: number; items: ReconciliationResult[] }>(
      `${API_BASE}/reconciliation/results?${params.toString()}`
    );
  },
  getResultDetail: (entityId: string) =>
    fetchJson<{ result: ReconciliationResult; lifecycle_graph: any }>(
      `${API_BASE}/reconciliation/results/${entityId}`
    ),
  getJournalExport: (format: string = "json", runId: string = "RUN-RZP-2026-001") =>
    fetchJson<JournalExport>(`${API_BASE}/reconciliation/journal-export?format=${format}&run_id=${runId}`),
  getJournalDownloadUrl: (format: "csv" | "tally_xml", runId: string = "RUN-RZP-2026-001") =>
    `${API_BASE}/reconciliation/journal-export?format=${format}&run_id=${runId}`,

  // Exceptions & Case Room
  getExceptions: (severity?: string, status?: string, limit: number = 50, offset: number = 0) => {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    if (severity && severity !== "ALL") params.append("severity", severity);
    if (status && status !== "ALL") params.append("status", status);
    return fetchJson<{ total: number; offset: number; limit: number; items: ExceptionRecord[] }>(
      `${API_BASE}/exceptions?${params.toString()}`
    );
  },
  getExceptionClusters: () => fetchJson<{ clusters: ExceptionCluster[] }>(`${API_BASE}/exceptions/clusters`),
  getExceptionDetail: (transactionId: string) =>
    fetchJson<{ exception: ExceptionRecord; evidence: any[]; lifecycle: any }>(
      `${API_BASE}/exceptions/${transactionId}`
    ),
  reviewException: (transactionId: string, action: string, notes?: string, actorId: string = "FINANCE_CONTROLLER") =>
    fetchJson<{ status: string; message: string; exception: ExceptionRecord; updated_cash_position: CashPosition }>(
      `${API_BASE}/exceptions/${transactionId}/review`,
      {
        method: "POST",
        body: JSON.stringify({ action, notes, actor_id: actorId }),
      }
    ),
  getDisputePackage: (transactionId: string, merchantId: string = "MID_RECONOS_ENTERPRISE") =>
    fetchJson<DisputePackage>(`${API_BASE}/exceptions/${transactionId}/dispute-package?merchant_id=${merchantId}`),
  getDisputeCsvUrl: (transactionId: string, merchantId: string = "MID_RECONOS_ENTERPRISE") =>
    `${API_BASE}/exceptions/${transactionId}/dispute-package/download-csv?merchant_id=${merchantId}`,

  // Cash Intelligence
  getCashPosition: () => fetchJson<CashPosition>(`${API_BASE}/cash/current`),
  getCashForecast: (horizonDays: number = 7) =>
    fetchJson<CashForecast>(`${API_BASE}/cash/forecast?horizon_days=${horizonDays}`),

  // AI Agent & Copilot
  investigateException: (transactionId: string) =>
    fetchJson<AgentInvestigation>(`${API_BASE}/agent/investigate/${transactionId}`, { method: "POST" }),
  askCopilot: (query: string) =>
    fetchJson<{
      answer: string;
      confidence: number;
      sources: string[];
      tools_used: string[];
      financial_facts: Record<string, any>;
      suggested_followups: string[];
    }>(`${API_BASE}/agent/ask`, {
      method: "POST",
      body: JSON.stringify({ query }),
    }),

  // Evaluation
  getEvaluationReport: () => fetchJson<EvaluationReport>(`${API_BASE}/evaluation/report`),

  // Audit Logs
  getAuditLogs: (limit: number = 100) =>
    fetchJson<{ total: number; logs: AuditEvent[] }>(`${API_BASE}/audit/logs?limit=${limit}`),

  // Razorpay Webhooks
  simulateWebhook: (event: string = "payment.captured", amountInr: number = 4999.0) =>
    fetchJson<{
      status: string;
      event_id: string;
      event: string;
      entity_id: string;
      signature_verified: boolean;
      simulated_signature: string;
      message: string;
    }>(`${API_BASE}/webhooks/razorpay/simulate`, {
      method: "POST",
      body: JSON.stringify({ event, amount_inr: amountInr }),
    }),
  getWebhookLogs: (limit: number = 20) =>
    fetchJson<{
      webhook_endpoint: string;
      secret_status: string;
      algorithm: string;
      total_events: number;
      events: WebhookLog[];
    }>(`${API_BASE}/webhooks/logs?limit=${limit}`),

  // Authentication & RBAC
  login: (email: string, password: string) =>
    fetchJson<AuthResponse>(`${API_BASE}/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (data: { email: string; password: string; name: string; role?: string; tenant_name?: string }) =>
    fetchJson<AuthResponse>(`${API_BASE}/auth/register`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getCurrentUser: (token?: string) =>
    fetchJson<{ user: UserProfile }>(
      `${API_BASE}/auth/me`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    ),
  switchRole: (role: string, token?: string) =>
    fetchJson<{ user: UserProfile; message: string }>(`${API_BASE}/auth/switch-role`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: JSON.stringify({ role }),
    }),
};

