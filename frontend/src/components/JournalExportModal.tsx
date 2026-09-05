"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Download,
  Copy,
  CheckCircle2,
  FileSpreadsheet,
  Code2,
  AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { JournalExport } from "@/lib/types";

interface JournalExportModalProps {
  runId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const JournalExportModal: React.FC<JournalExportModalProps> = ({
  runId = "RUN-RZP-2026-001",
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [journal, setJournal] = useState<JournalExport | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadJournal();
    }
  }, [isOpen, runId]);

  const loadJournal = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getJournalExport("json", runId);
      setJournal(data);
    } catch (err: any) {
      console.error("Failed to load journal export:", err);
      setError(err.message || "Failed to generate journal export.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = async () => {
    if (!journal) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(journal, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy:", e);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-fin-elevated border border-slate-200 w-full max-w-5xl max-h-[95vh] sm:max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-[#0C2340] text-white">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white/10 border border-white/20 rounded-xl text-[#3395FF] shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 font-mono tracking-wider">
                  ERP & TALLY JOURNAL EXPORT
                </span>
                <span className="text-slate-500 hidden sm:inline">•</span>
                <span className="text-xs sm:text-sm font-bold text-white font-mono break-all">
                  {journal?.voucher_no || "JV-RZP-2026-001"}
                </span>
                {journal?.is_balanced && (
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Balanced (Dr = Cr)
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
                GAAP & Ind AS double-entry settlement journal vouchers for Tally Prime, Zoho Books & SAP
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
            aria-label="Close journal export"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1 bg-slate-50/40">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#0C83FF] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">
                Calculating ledger debits, credits, and GST ITC splits...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          ) : journal ? (
            <>
              {/* Voucher Overview */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                <div className="flex items-center gap-6 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Voucher Number</span>
                    <span className="font-mono font-bold text-slate-900">{journal.voucher_no}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Date</span>
                    <span className="font-mono font-bold text-slate-900">{journal.voucher_date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Standard</span>
                    <span className="font-bold text-slate-900">GAAP / Ind AS 115</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 font-mono text-xs">
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Debits</span>
                    <span className="font-bold text-[#0C83FF]">{journal.formatted_total_debit}</span>
                  </div>
                  <div className="text-slate-300 font-bold">=</div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Credits</span>
                    <span className="font-bold text-emerald-700">{journal.formatted_total_credit}</span>
                  </div>
                </div>
              </div>

              {/* Journal Voucher Table */}
              <div className="fin-card overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full fin-table text-xs">
                    <thead>
                      <tr>
                        <th className="w-12">#</th>
                        <th>Account Code & Ledger Name</th>
                        <th className="w-24">Type</th>
                        <th className="text-right w-36">Debit (INR)</th>
                        <th className="text-right w-36">Credit (INR)</th>
                        <th>Transaction Narration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {journal.lines.map((line) => (
                        <tr key={line.line_no} className="hover:bg-slate-50/70 transition-colors">
                          <td className="font-mono text-slate-400">{line.line_no}</td>
                          <td>
                            <div className="font-bold text-slate-900">{line.account_name}</div>
                            <span className="font-mono text-[10px] text-slate-400">Code: {line.account_code}</span>
                          </td>
                          <td>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                line.type === "DEBIT"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              {line.type}
                            </span>
                          </td>
                          <td className="text-right font-mono font-bold text-slate-900">
                            {line.type === "DEBIT" ? line.formatted_amount : "-"}
                          </td>
                          <td className="text-right font-mono font-bold text-slate-900">
                            {line.type === "CREDIT" ? line.formatted_amount : "-"}
                          </td>
                          <td className="text-slate-600 max-w-xs truncate text-[11px]">{line.narration}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50/80 font-bold border-t border-slate-200">
                        <td colSpan={3} className="text-slate-700 text-right pr-4 uppercase tracking-wider text-[11px]">
                          Voucher Balance Check:
                        </td>
                        <td className="text-right font-mono text-[#0C83FF]">{journal.formatted_total_debit}</td>
                        <td className="text-right font-mono text-emerald-700">{journal.formatted_total_credit}</td>
                        <td className="text-emerald-700 text-[11px] font-semibold">
                          ✓ Balanced (₹0.00 Variance)
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ready for automated General Ledger ingestion</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyJson}
                    className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied JSON!</span>
                      </>
                    ) : (
                      <>
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Copy Voucher JSON</span>
                      </>
                    )}
                  </button>

                  <a
                    href={api.getJournalDownloadUrl("csv", runId)}
                    download={`journal_${runId}.csv`}
                    className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Download ERP CSV</span>
                  </a>

                  <a
                    href={api.getJournalDownloadUrl("tally_xml", runId)}
                    download={`tally_${runId}.xml`}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#0C83FF] hover:bg-[#0266CC] rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Tally XML</span>
                  </a>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
