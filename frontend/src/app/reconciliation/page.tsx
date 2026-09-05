"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle2,
  Info,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Download,
  UploadCloud,
  BookOpen,
  Radio
} from "lucide-react";
import { api } from "@/lib/api";
import { ReconciliationResult, ReconciliationRun } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { WhyMatchedModal } from "@/components/WhyMatchedModal";
import { JournalExportModal } from "@/components/JournalExportModal";
import { CsvUploaderModal } from "@/components/CsvUploaderModal";
import { WebhookSimulatorModal } from "@/components/WebhookSimulatorModal";
import { formatINR } from "@/lib/utils";

export default function ReconciliationWorkspacePage() {
  const [loading, setLoading] = useState(true);
  const [run, setRun] = useState<ReconciliationRun | null>(null);
  const [results, setResults] = useState<ReconciliationResult[]>([]);
  const [total, setTotal] = useState(0);
  const [decisionFilter, setDecisionFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 25;

  // Why Matched Modal
  const [selectedResult, setSelectedResult] = useState<ReconciliationResult | null>(null);
  const [whyModalOpen, setWhyModalOpen] = useState(false);

  // New Modals
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [decisionFilter, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [r, resList] = await Promise.all([
        api.getLatestRun(),
        api.getResults(decisionFilter, pageSize, page * pageSize),
      ]);
      setRun(r);
      setResults(resList.items);
      setTotal(resList.total);
    } catch (err) {
      console.error("Failed to load reconciliation results:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.entity_id.toLowerCase().includes(q) ||
      item.matched_record_ids.some((id) => id.toLowerCase().includes(q))
    );
  });

  const filterOptions = [
    "ALL",
    "MATCHED",
    "TIMING_VARIANCE",
    "PARTIAL_SETTLEMENT",
    "FEE_MISMATCH",
    "TAX_MISMATCH",
    "MISSING_SETTLEMENT",
    "MISSING_BANK_CREDIT",
    "DUPLICATE",
    "AMBIGUOUS_MATCH"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reconciliation Workspace</h1>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
              Run: {run?.run_id || "RUN-RZP-2026-001"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspect line-by-line financial reconciliation matches, candidate scoring, and mathematical settlements.
          </p>
        </div>

        {/* Actions & Stats Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setCsvModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <UploadCloud className="w-3.5 h-3.5 text-[#0C83FF]" />
            <span>Upload CSV</span>
          </button>

          <button
            onClick={() => setJournalModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#0C83FF]" />
            <span>Export ERP Journal</span>
          </button>

          <button
            onClick={() => setWebhookModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold text-[#0C83FF] bg-blue-50/80 hover:bg-blue-100 border border-blue-200 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Live Webhooks</span>
          </button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Stats Strip */}
          <div className="flex items-center gap-2 text-xs">
            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
              <span className="text-slate-500 mr-1.5">Matched:</span>
              <span className="font-mono font-bold text-emerald-700">{run?.matched_count || 0}</span>
            </div>
            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
              <span className="text-slate-500 mr-1.5">Exceptions:</span>
              <span className="font-mono font-bold text-rose-700">{run?.exception_count || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="fin-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order ID, Payment ID, Settlement, or Bank UTR..."
            className="w-full text-xs pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        {/* Decision Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {filterOptions.slice(0, 6).map((opt) => (
            <button
              key={opt}
              onClick={() => {
                setDecisionFilter(opt);
                setPage(0);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                decisionFilter === opt
                  ? "bg-blue-600 text-white font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {opt.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Results Table */}
      <div className="fin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full fin-table">
            <thead>
              <tr>
                <th>Lifecycle Order ID</th>
                <th>Matched References</th>
                <th>Expected Net</th>
                <th>Actual Settlement</th>
                <th>Variance</th>
                <th>Status</th>
                <th>Score</th>
                <th>Attribution</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                    Loading reconciliation records...
                  </td>
                </tr>
              ) : filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500 text-xs">
                    No transactions match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredResults.map((item) => (
                  <tr key={item.entity_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="font-mono font-bold text-slate-900">{item.entity_id}</td>
                    <td className="font-mono text-xs text-slate-600 max-w-xs truncate">
                      {item.matched_record_ids.join(" • ") || "-"}
                    </td>
                    <td className="font-mono text-slate-900">{formatINR(item.expected_amount_minor)}</td>
                    <td className="font-mono text-slate-900">{formatINR(item.actual_amount_minor)}</td>
                    <td
                      className={`font-mono font-bold ${
                        item.variance_minor > 0 ? "text-rose-600" : "text-emerald-700"
                      }`}
                    >
                      {item.variance_minor > 0 ? formatINR(item.variance_minor) : "₹0.00"}
                    </td>
                    <td>
                      <StatusBadge status={item.decision} size="sm" />
                    </td>
                    <td className="font-mono text-xs font-bold text-slate-700">
                      {Math.round(item.confidence * 100)}%
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setSelectedResult(item);
                          setWhyModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-md border border-slate-200 transition-colors flex items-center gap-1"
                      >
                        <Info className="w-3 h-3" />
                        <span>Why Matched?</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-800">{filteredResults.length}</span> of{" "}
            <span className="font-bold text-slate-800">{total}</span> records
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono font-medium">Page {page + 1}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * pageSize >= total}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Why Matched Explainability Modal */}
      <WhyMatchedModal
        result={selectedResult}
        isOpen={whyModalOpen}
        onClose={() => {
          setWhyModalOpen(false);
          setSelectedResult(null);
        }}
      />

      {/* Journal Export Modal */}
      <JournalExportModal
        runId={run?.run_id || "RUN-RZP-2026-001"}
        isOpen={journalModalOpen}
        onClose={() => setJournalModalOpen(false)}
      />

      {/* Real CSV Uploader Modal */}
      <CsvUploaderModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onSuccess={() => {
          loadData();
        }}
      />

      {/* Razorpay Webhook Simulator Modal */}
      <WebhookSimulatorModal
        isOpen={webhookModalOpen}
        onClose={() => setWebhookModalOpen(false)}
        onEventProcessed={() => {
          loadData();
        }}
      />
    </div>
  );
}
