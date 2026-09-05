"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  ShieldCheck,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { api } from "@/lib/api";
import { AuditEvent } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function AuditPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs(100);
      setLogs(res.logs);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.entity_id.toLowerCase().includes(q) ||
      log.actor_id.toLowerCase().includes(q) ||
      log.tamper_hash.toLowerCase().includes(q)
    );
  });

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `reconos_audit_trail_${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Compliance Audit Trail & Decision Provenance</h1>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-500" />
              <span>SHA-256 Cryptographic Sealing</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log recording every deterministic rule match, AI investigation, policy retrieval, and human controller approval.
          </p>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportJson}
          className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Audit Log (JSON)</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="fin-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, entity ID, controller name, or SHA-256 hash..."
            className="w-full text-xs pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Showing <span className="font-bold text-slate-800">{filteredLogs.length}</span> audit records
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="fin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full fin-table min-w-[850px]">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action Recorded</th>
                <th>Entity Target</th>
                <th>Decision Reason / Justification</th>
                <th>Tamper-Evident SHA-256 Hash</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    Loading compliance audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 text-xs">
                    No audit records match the query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="font-mono text-xs font-bold text-slate-900">{log.id}</td>
                    <td className="font-mono text-xs text-slate-500">{formatDate(log.created_at)}</td>
                    <td>
                      <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {log.actor_id} ({log.actor_type})
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-mono font-bold text-blue-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-slate-800 font-semibold">{log.entity_id}</td>
                    <td className="text-xs text-slate-600 max-w-sm leading-relaxed">{log.reason}</td>
                    <td>
                      <span
                        title={log.tamper_hash}
                        className="font-mono text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200 inline-block max-w-[140px] truncate"
                      >
                        {log.tamper_hash}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
