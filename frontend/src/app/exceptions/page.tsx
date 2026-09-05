"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle,
  Layers,
  ShieldAlert,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  LayoutGrid,
  List,
  DollarSign,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { ExceptionRecord, ExceptionCluster } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { CaseRoomModal } from "@/components/CaseRoomModal";
import { formatINR, formatDate } from "@/lib/utils";

export default function ExceptionsPage() {
  const [loading, setLoading] = useState(true);
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
  const [clusters, setClusters] = useState<ExceptionCluster[]>([]);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClusterPattern, setSelectedClusterPattern] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Case Room modal state
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseModalOpen, setCaseModalOpen] = useState(false);

  useEffect(() => {
    loadExceptions();
  }, [severityFilter, statusFilter]);

  const loadExceptions = async () => {
    try {
      setLoading(true);
      const [excsRes, clusRes] = await Promise.all([
        api.getExceptions(severityFilter, statusFilter, 100, 0),
        api.getExceptionClusters(),
      ]);
      setExceptions(excsRes.items);
      setClusters(clusRes.clusters);
    } catch (err) {
      console.error("Failed to load exceptions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered exceptions based on search and cluster selection
  const filteredExceptions = useMemo(() => {
    return exceptions.filter((exc) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = exc.transaction_id.toLowerCase().includes(q);
        const matchesType = exc.exception_type.toLowerCase().includes(q);
        const matchesCause = (exc.root_cause || "").toLowerCase().includes(q);
        if (!matchesId && !matchesType && !matchesCause) return false;
      }

      // Cluster pattern filter
      if (selectedClusterPattern) {
        if (exc.root_cause !== selectedClusterPattern && exc.exception_type !== selectedClusterPattern) {
          return false;
        }
      }

      return true;
    });
  }, [exceptions, searchQuery, selectedClusterPattern]);

  // Metric computations
  const totalExposure = useMemo(() => {
    return filteredExceptions.reduce((sum, e) => sum + (e.financial_exposure_minor || 0), 0);
  }, [filteredExceptions]);

  const criticalCount = useMemo(() => {
    return filteredExceptions.filter((e) => e.severity === "CRITICAL").length;
  }, [filteredExceptions]);

  const highCount = useMemo(() => {
    return filteredExceptions.filter((e) => e.severity === "HIGH").length;
  }, [filteredExceptions]);

  const severityTabs = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Top Banner Header */}
      <div className="fin-card p-6 bg-gradient-to-r from-white via-slate-50/60 to-white border-l-4 border-l-[#0C83FF] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-[#0C2340] tracking-tight">
              Exception Queue & Case Room
            </h1>
            <span className="text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full shadow-2xs">
              {filteredExceptions.length} Active Breaks
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
            Autonomous discrepancy isolation, root-cause clustering, and cryptographically anchored human sign-off for Razorpay settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadExceptions()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Container Boxes - Pixel-perfect padding and typography */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Box 1: Total Financial Exposure */}
        <div className="fin-card p-6 flex flex-col justify-between hover:border-rose-300">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Financial Exposure
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-2xs">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl lg:text-3xl font-black font-mono text-[#0C2340] tracking-tight">
              {formatINR(totalExposure)}
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Across active breaks</span>
            <span className="font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              Action Required
            </span>
          </div>
        </div>

        {/* Box 2: Critical Severity Breaks */}
        <div className="fin-card p-6 flex flex-col justify-between hover:border-red-300">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Critical Risk Cases
              </span>
              <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-2xs">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl lg:text-3xl font-black font-mono text-red-600 tracking-tight">
              {criticalCount}
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>High Risk &gt; ₹50k</span>
            <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {highCount} High Priority
            </span>
          </div>
        </div>

        {/* Box 3: Root Cause Clusters */}
        <div className="fin-card p-6 flex flex-col justify-between hover:border-blue-300">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Systemic Patterns
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0C83FF] shadow-2xs">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl lg:text-3xl font-black font-mono text-[#0C2340] tracking-tight">
              {clusters.length} Clusters
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Grouped by Root Cause</span>
            <span className="font-bold text-[#0C83FF] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Auto-Clustered
            </span>
          </div>
        </div>

        {/* Box 4: Settlement Integrity */}
        <div className="fin-card p-6 flex flex-col justify-between hover:border-emerald-300">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Resolution Protocol
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl lg:text-3xl font-black font-mono text-emerald-700 tracking-tight">
              Zero False Matches
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Honest Exception List</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              100% Deterministic
            </span>
          </div>
        </div>
      </div>

      {/* Flagship Section: Systemic Exception Clusters (Root Cause Grouping Cards) */}
      <div className="fin-card p-6">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-[#0C83FF] rounded-xl border border-blue-100">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0C2340] uppercase tracking-wider">
                Systemic Exception Clusters (Root Cause Grouping)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-transaction patterns isolated by deterministic pattern recognition algorithms.
              </p>
            </div>
          </div>

          {selectedClusterPattern && (
            <button
              onClick={() => setSelectedClusterPattern(null)}
              className="text-xs font-bold text-[#0C83FF] hover:underline bg-blue-50 px-3 py-1 rounded-lg border border-blue-200"
            >
              Clear Cluster Filter ✕
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clusters.map((c) => {
            const isSelected = selectedClusterPattern === c.root_cause;
            return (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedClusterPattern(isSelected ? null : c.root_cause);
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between text-left group ${
                  isSelected
                    ? "bg-blue-50/70 border-[#0C83FF] ring-2 ring-blue-200 shadow-md"
                    : "bg-slate-50/60 hover:bg-slate-50 border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-sm"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <span className="font-bold text-xs text-[#0C2340] group-hover:text-[#0C83FF] transition-colors line-clamp-1">
                      {c.name}
                    </span>
                    <span className="shrink-0 text-[11px] font-mono font-bold text-[#0C83FF] bg-white border border-blue-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                      {c.affected_count} txns
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {c.pattern_summary}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-200/70 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Exposure:</span>
                  <span className="font-mono font-bold text-[#0C2340]">
                    {formatINR(c.total_exposure_minor)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and View Control Toolbar Box */}
      <div className="fin-card p-5 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Left: Search Bar & Severity Pills */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Transaction ID, Class..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0C83FF] bg-slate-50/50 font-medium"
            />
          </div>

          {/* Severity Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {severityTabs.map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  severityFilter === sev
                    ? "bg-[#0C2340] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Status Dropdown & View Mode Switcher */}
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0C83FF]"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open Only</option>
              <option value="RESOLVED">Resolved Only</option>
            </select>
          </div>

          {/* View Mode Toggle: Cards vs Table */}
          <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-slate-50">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === "cards" ? "bg-white text-[#0C83FF] shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Box / Container Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === "table" ? "bg-white text-[#0C83FF] shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Structured Ledger Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Cards Box Grid OR Structured Table Box */}
      {viewMode === "cards" ? (
        /* Box / Container Card Grid View */
        <div>
          {loading ? (
            <div className="fin-card p-16 text-center text-xs text-slate-500 space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0C83FF]" />
              <p className="font-semibold">Loading exception containers...</p>
            </div>
          ) : filteredExceptions.length === 0 ? (
            <div className="fin-card p-16 text-center text-xs text-slate-500 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="font-bold text-slate-800 text-sm">No Exceptions Found</div>
              <p>All records match your filter criteria or have been successfully reconciled.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredExceptions.map((exc) => (
                <div
                  key={exc.transaction_id}
                  className="fin-card p-5 flex flex-col justify-between border hover:border-[#0C83FF] shadow-sm hover:shadow-md transition-all group"
                >
                  {/* Top Bar of Container Box */}
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-[#0C2340] group-hover:text-[#0C83FF] transition-colors">
                          {exc.transaction_id}
                        </span>
                        <StatusBadge status={exc.severity} size="sm" />
                      </div>
                      <StatusBadge status={exc.status} size="sm" />
                    </div>

                    {/* Discrepancy Tag */}
                    <div className="mt-3.5 flex items-center justify-between">
                      <StatusBadge status={exc.exception_type} size="sm" />
                      <span className="text-[11px] font-mono text-slate-400">T+2 SLA</span>
                    </div>

                    {/* Root Cause Box Container with generous padding */}
                    <div className="mt-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Root Cause Diagnosis
                      </div>
                      <div className="font-mono text-xs font-bold text-slate-800 leading-snug">
                        {exc.root_cause || "UNRESOLVED_DISCREPANCY"}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Exposure & Action Container */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Exposure
                      </div>
                      <div className="font-mono text-base font-black text-[#0C2340]">
                        {formatINR(exc.financial_exposure_minor)}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCaseId(exc.transaction_id);
                        setCaseModalOpen(true);
                      }}
                      className="px-4 py-2 bg-blue-50 hover:bg-[#0C83FF] text-[#0C83FF] hover:text-white border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs group/btn"
                    >
                      <span>Investigate</span>
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Structured Ledger Table Box View */
        <div className="fin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full fin-table min-w-[760px]">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Discrepancy Class</th>
                  <th>Severity</th>
                  <th>Root Cause Analysis</th>
                  <th>Financial Exposure</th>
                  <th>Status</th>
                  <th>Governance Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                      Loading exception queue...
                    </td>
                  </tr>
                ) : filteredExceptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500 text-xs">
                      No exceptions match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredExceptions.map((exc) => (
                    <tr key={exc.transaction_id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="font-mono font-bold text-[#0C2340] px-4 py-3.5">{exc.transaction_id}</td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={exc.exception_type} size="sm" />
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={exc.severity} size="sm" />
                      </td>
                      <td className="font-mono text-xs text-slate-700 font-semibold px-4 py-3.5">{exc.root_cause}</td>
                      <td className="font-mono font-bold text-[#0C2340] px-4 py-3.5">
                        {formatINR(exc.financial_exposure_minor)}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={exc.status} size="sm" />
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => {
                            setSelectedCaseId(exc.transaction_id);
                            setCaseModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 bg-blue-50 hover:bg-[#0C83FF] text-[#0C83FF] hover:text-white border border-blue-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <span>Investigate</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Case Room Modal */}
      {selectedCaseId && (
        <CaseRoomModal
          transactionId={selectedCaseId}
          isOpen={caseModalOpen}
          onClose={() => {
            setCaseModalOpen(false);
            setSelectedCaseId(null);
          }}
          onActionComplete={loadExceptions}
        />
      )}
    </div>
  );
}
