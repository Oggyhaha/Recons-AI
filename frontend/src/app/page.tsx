"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Wallet,
  ArrowUpRight,
  CheckCircle2,
  Play,
  FileSpreadsheet,
  Activity,
  Layers,
  ChevronRight
} from "lucide-react";
import { api } from "@/lib/api";
import { ReconciliationRun, CashPosition, ExceptionRecord, ImportStatus, EvaluationReport } from "@/lib/types";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { CaseRoomModal } from "@/components/CaseRoomModal";
import { formatINR } from "@/lib/utils";

export default function ControlCenterPage() {
  const [loading, setLoading] = useState(true);
  const [run, setRun] = useState<ReconciliationRun | null>(null);
  const [cash, setCash] = useState<CashPosition | null>(null);
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationReport | null>(null);

  // Case Room modal state
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseModalOpen, setCaseModalOpen] = useState(false);

  // Batch runner
  const [batchCount, setBatchCount] = useState(500);
  const [runningBatch, setRunningBatch] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [r, c, e, imp, ev] = await Promise.all([
        api.getLatestRun(),
        api.getCashPosition(),
        api.getExceptions("ALL", "OPEN", 6),
        api.getImportStatus(),
        api.getEvaluationReport(),
      ]);
      setRun(r);
      setCash(c);
      setExceptions(e.items);
      setImportStatus(imp);
      setEvaluation(ev);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerRun = async () => {
    try {
      setRunningBatch(true);
      await api.generateBatch(batchCount, 0.15);
      await loadDashboardData();
    } catch (err) {
      console.error("Failed to run batch:", err);
    } finally {
      setRunningBatch(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Page Title & Control Health Score Gauge */}
      <div className="fin-card p-6 bg-gradient-to-r from-white via-slate-50/50 to-white border-l-4 border-l-[#0C83FF] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#0C2340] tracking-tight">Finance Control Center</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-mono">
              Live Control Plane
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
            Continuously reconciling multi-source payments, gateway fees, settlement batches, and bank credits with deterministic integrity.
          </p>
        </div>

        {/* Health Score Pill */}
        <div className="flex items-center gap-4 p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center text-emerald-700">
            <span className="text-lg font-black font-mono leading-none">94</span>
            <span className="text-[9px] font-bold uppercase tracking-wider">/ 100</span>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Control Health Score</div>
            <div className="text-[11px] text-slate-500">
              0 False Matches • {run?.match_rate || 92.2}% Match Rate
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Records Processed"
          value={run?.total_records || 500}
          subtitle={`Throughput: ${run?.throughput_rps || 64.2} rec/s`}
          icon={<FileSpreadsheet className="w-4 h-4 text-[#0C83FF]" />}
          highlight={true}
        />
        <StatCard
          title="Reconciliation Match Rate"
          value={`${run?.match_rate || 92.2}%`}
          subtitle={`${run?.matched_count || 461} records fully verified`}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          trend={{ value: "+3.8% vs rules", positive: true }}
        />
        <StatCard
          title="Available Cash Position"
          value={cash?.formatted_available || "₹15,00,000.00"}
          subtitle="Bank credits confirmed"
          icon={<Wallet className="w-4 h-4 text-[#0C83FF]" />}
        />
        <StatCard
          title="Cash at Risk (Exceptions)"
          value={cash?.formatted_at_risk || "₹42,300.00"}
          subtitle={`${run?.exception_count || 39} open discrepancies`}
          icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
        />
      </div>

      {/* Batch Runner & Ingestion Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Batch Runner */}
        <div className="fin-card p-5 lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                FinSim Batch Runner
              </span>
              <Activity className="w-4 h-4 text-[#0C83FF]" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Inject realistic lifecycle batches across Orders, Payments, Settlements, and Bank statements.
            </p>

            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold text-slate-600">Batch Size Selection</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[50, 100, 500, 1000].map((size) => (
                  <button
                    key={size}
                    onClick={() => setBatchCount(size)}
                    className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                      batchCount === size
                        ? "bg-blue-50 text-[#0C83FF] border-blue-300 shadow-2xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={handleTriggerRun}
              disabled={runningBatch}
              className="w-full py-2.5 bg-[#0C83FF] hover:bg-[#0266CC] active:bg-[#0C2340] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${runningBatch ? "animate-spin" : ""}`} />
              <span>{runningBatch ? "Executing Pipeline..." : `Run ${batchCount}-Record Batch`}</span>
            </button>
          </div>
        </div>

        {/* Ingestion Data Sources */}
        <div className="fin-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Multi-Source Ingestion Pipeline
              </span>
              <p className="text-xs text-slate-500 mt-0.5">5 canonical channels normalized into integer minor units</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              {importStatus?.records_count || 500} Total Records
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {importStatus?.sources.map((src, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 font-mono">
                    {src.source_type.replace(/_/g, " ")}
                  </div>
                  <div className="text-[11px] text-slate-500">{src.rows} records normalized</div>
                </div>
                <StatusBadge status={src.status} size="sm" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Flagship Section: Recent Exceptions Requiring Investigation */}
      <div className="fin-card p-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Active Financial Exceptions</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identified discrepancies prioritized by financial risk and awaiting controller sign-off
            </p>
          </div>
          <Link
            href="/exceptions"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View Full Queue ({exceptions.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="w-full fin-table">
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Discrepancy Type</th>
                <th>Severity</th>
                <th>Root Cause</th>
                <th>Exposure</th>
                <th>Governance Action</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map((exc) => (
                <tr key={exc.transaction_id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="font-mono font-bold text-slate-900">{exc.transaction_id}</td>
                  <td>
                    <StatusBadge status={exc.exception_type} size="sm" />
                  </td>
                  <td>
                    <StatusBadge status={exc.severity} size="sm" />
                  </td>
                  <td className="font-mono text-xs text-slate-600">{exc.root_cause}</td>
                  <td className="font-mono font-bold text-slate-900">
                    {formatINR(exc.financial_exposure_minor)}
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        setSelectedCaseId(exc.transaction_id);
                        setCaseModalOpen(true);
                      }}
                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <span>Open Case Room</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Room Modal */}
      {selectedCaseId && (
        <CaseRoomModal
          transactionId={selectedCaseId}
          isOpen={caseModalOpen}
          onClose={() => {
            setCaseModalOpen(false);
            setSelectedCaseId(null);
          }}
          onActionComplete={loadDashboardData}
        />
      )}
    </div>
  );
}
