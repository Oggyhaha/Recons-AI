"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  Download,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Printer,
  ShieldAlert
} from "lucide-react";
import { api } from "@/lib/api";
import { DisputePackage } from "@/lib/types";
import { formatINR } from "@/lib/utils";

interface DisputePackageModalProps {
  transactionId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const DisputePackageModal: React.FC<DisputePackageModalProps> = ({
  transactionId,
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [pkg, setPkg] = useState<DisputePackage | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && transactionId) {
      loadDisputePackage();
    }
  }, [isOpen, transactionId]);

  const loadDisputePackage = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDisputePackage(transactionId);
      setPkg(data);
    } catch (err: any) {
      console.error("Failed to load dispute package:", err);
      setError(err.message || "Failed to generate dispute package.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMemo = async () => {
    if (!pkg) return;
    try {
      await navigator.clipboard.writeText(pkg.formal_memo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy:", e);
    }
  };

  const handlePrint = () => {
    if (!pkg) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${pkg.dispute_reference} - Razorpay Dispute Memo</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0C2340; line-height: 1.6; }
              pre { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; white-space: pre-wrap; font-family: monospace; font-size: 13px; }
              h1 { color: #0C2340; border-bottom: 2px solid #0C83FF; padding-bottom: 8px; }
              .header { margin-bottom: 24px; }
            </style>
          </head>
          <body>
            <pre>${pkg.formal_memo}</pre>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-fin-elevated border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-[#0C2340] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 border border-white/20 rounded-xl text-[#3395FF]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-300 font-mono tracking-wider">
                  DISPUTE RECOVERY PACKAGE
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-sm font-bold text-white font-mono">
                  {pkg?.dispute_reference || transactionId}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Official Razorpay merchant claim memo & CSV calculation evidence
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/40">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#0C83FF] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">
                Compiling dispute evidence and mathematical audit proofs...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          ) : pkg ? (
            <>
              {/* Financial Claim KPI Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                    Claimed Recovery
                  </span>
                  <div className="text-lg font-mono font-bold text-emerald-700">
                    {formatINR(pkg.claimed_overcharge_minor)}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">Demanded Reversal</span>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Gross Transaction
                  </span>
                  <div className="text-lg font-mono font-bold text-[#0C2340]">
                    {formatINR(pkg.gross_amount_minor)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium font-mono">
                    {pkg.transaction_id}
                  </span>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Discrepancy Cause
                  </span>
                  <div className="text-sm font-mono font-bold text-rose-600 truncate mt-1">
                    {pkg.root_cause}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Pricing Variance</span>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Merchant Account
                  </span>
                  <div className="text-sm font-mono font-bold text-slate-800 truncate mt-1">
                    {pkg.merchant_id}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Contract Addendum v1</span>
                </div>
              </div>

              {/* Formal Notice Preview */}
              <div className="fin-card p-4 bg-white">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#0C83FF]" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Formal Notice to Razorpay Operations
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    To: merchant-support@razorpay.com
                  </span>
                </div>

                <pre className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 font-mono text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                  {pkg.formal_memo}
                </pre>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Anchored into SHA-256 Compliance Audit Log</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyMemo}
                    className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Memo</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handlePrint}
                    className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Letter (PDF)</span>
                  </button>

                  <a
                    href={api.getDisputeCsvUrl(transactionId)}
                    download={`dispute_${transactionId}.csv`}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#0C83FF] hover:bg-[#0266CC] rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Evidence CSV</span>
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
