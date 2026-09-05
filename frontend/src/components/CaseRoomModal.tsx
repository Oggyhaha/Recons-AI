"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Bot,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { ExceptionRecord, AgentInvestigation } from "@/lib/types";
import { formatINR, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { DisputePackageModal } from "./DisputePackageModal";

interface CaseRoomModalProps {
  transactionId: string;
  isOpen: boolean;
  onClose: () => void;
  onActionComplete?: () => void;
}

export const CaseRoomModal: React.FC<CaseRoomModalProps> = ({
  transactionId,
  isOpen,
  onClose,
  onActionComplete,
}) => {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<{ exception: ExceptionRecord; evidence: any[]; lifecycle: any } | null>(null);
  const [agentInvestigation, setAgentInvestigation] = useState<AgentInvestigation | null>(null);
  const [investigating, setInvestigating] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionNotes, setActionNotes] = useState("");
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && transactionId) {
      loadData();
    }
  }, [isOpen, transactionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setActionFeedback(null);
      const res = await api.getExceptionDetail(transactionId);
      setDetail(res);

      // Trigger agent investigation automatically
      setInvestigating(true);
      const inv = await api.investigateException(transactionId);
      setAgentInvestigation(inv);
    } catch (err) {
      console.error("Failed to load exception detail:", err);
    } finally {
      setLoading(false);
      setInvestigating(false);
    }
  };

  const handleReviewAction = async (action: "APPROVE" | "REJECT" | "REQUEST_REVIEW") => {
    try {
      setSubmittingAction(true);
      const res = await api.reviewException(transactionId, action, actionNotes, "FINANCE_CONTROLLER_AARAV");
      setActionFeedback(`Action ${action} recorded in immutable audit log. Status: ${res.exception.status}.`);
      if (onActionComplete) onActionComplete();
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      console.error("Failed to submit review action:", err);
    } finally {
      setSubmittingAction(false);
    }
  };

  if (!isOpen) return null;

  const exc = detail?.exception;
  const lifecycle = detail?.lifecycle;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-fin-elevated border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-[#0C2340] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 border border-white/20 rounded-xl text-[#3395FF]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-300 font-mono tracking-wider">CASE ROOM</span>
                <span className="text-slate-500">•</span>
                <span className="text-base font-bold text-white font-mono">{transactionId}</span>
                {exc && <StatusBadge status={exc.severity} size="sm" />}
                {exc && <StatusBadge status={exc.status} size="sm" />}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Cryptographic lifecycle verification & AI controller investigation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDisputeModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-[#0C83FF] hover:bg-[#0266CC] rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate Dispute Package</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/40">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#0C83FF] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Loading financial lifecycle nodes & evidence...</p>
            </div>
          ) : (
            <>
              {/* 1. Interactive Financial Lifecycle Graph */}
              <div className="fin-card p-5 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Financial Lifecycle Graph
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Exposure:{" "}
                    <span className="font-bold text-[#0C2340]">
                      {formatINR(exc?.financial_exposure_minor || 0)}
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
                  {/* Step 1: ORDER */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      lifecycle?.order
                        ? "bg-slate-50/70 border-slate-200 shadow-2xs"
                        : "bg-rose-50/40 border-rose-200/80 border-dashed"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-700 font-mono">1. ORDER</span>
                      {lifecycle?.order ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                    <div className="font-mono text-sm font-bold text-slate-900">
                      {lifecycle?.order ? formatINR(lifecycle.order.gross_amount_minor) : "Missing"}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 truncate">
                      {lifecycle?.order?.order_id || "No commerce order"}
                    </div>
                  </div>

                  {/* Step 2: PAYMENT */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      lifecycle?.payment
                        ? "bg-slate-50/70 border-slate-200 shadow-2xs"
                        : "bg-rose-50/40 border-rose-200/80 border-dashed"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-700 font-mono">2. GATEWAY PAYMENT</span>
                      {lifecycle?.payment ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                    <div className="font-mono text-sm font-bold text-slate-900">
                      {lifecycle?.payment ? formatINR(lifecycle.payment.gross_amount_minor) : "Missing"}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 truncate">
                      {lifecycle?.payment?.payment_id || "Uncaptured gateway txn"}
                    </div>
                  </div>

                  {/* Step 3: SETTLEMENT */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      lifecycle?.settlement
                        ? "bg-slate-50/70 border-slate-200 shadow-2xs"
                        : "bg-rose-50/40 border-rose-200/80 border-dashed"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-700 font-mono">3. SETTLEMENT</span>
                      {lifecycle?.settlement ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                    <div className="font-mono text-sm font-bold text-slate-900">
                      {lifecycle?.settlement ? formatINR(lifecycle.settlement.net_amount_minor) : "Pending/Missing"}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 truncate">
                      {lifecycle?.settlement?.settlement_id || "No settlement payout"}
                    </div>
                  </div>

                  {/* Step 4: BANK CREDIT */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      lifecycle?.bank
                        ? "bg-slate-50/70 border-slate-200 shadow-2xs"
                        : "bg-rose-50/40 border-rose-200/80 border-dashed"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-700 font-mono">4. BANK STATEMENT</span>
                      {lifecycle?.bank ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                    <div className="font-mono text-sm font-bold text-slate-900">
                      {lifecycle?.bank ? formatINR(lifecycle.bank.amount_minor) : "Uncredited"}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 truncate">
                      {lifecycle?.bank?.bank_reference || "No matching UTR"}
                    </div>
                  </div>
                </div>

                {/* Refund Node if present */}
                {lifecycle?.refund && (
                  <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-900">
                      Associated Customer Refund: {formatINR(lifecycle.refund.amount_minor)}
                    </span>
                    <span className="font-mono text-slate-600 font-semibold">{lifecycle.refund.refund_id}</span>
                  </div>
                )}
              </div>

              {/* 2. AI Investigator Findings */}
              <div className="fin-card p-5 border-l-4 border-l-[#0C83FF] bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-[#0C83FF]" />
                    <span className="text-xs font-bold text-[#0C2340] uppercase tracking-wider">
                      AI Controller Investigation Findings
                    </span>
                  </div>
                  {agentInvestigation && (
                    <span className="text-xs font-mono font-bold text-[#0C83FF] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      Confidence: {Math.round(agentInvestigation.output.confidence * 100)}%
                    </span>
                  )}
                </div>

                {agentInvestigation ? (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-800 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                      {agentInvestigation.output.finding}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                        <span className="font-bold text-slate-500 block mb-1">Root Cause Code</span>
                        <span className="font-mono font-bold text-[#0C2340]">
                          {agentInvestigation.output.root_cause}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                        <span className="font-bold text-slate-500 block mb-1">Recommended Action</span>
                        <span className="font-mono font-bold text-[#0C83FF]">
                          {agentInvestigation.output.recommended_action}
                        </span>
                      </div>
                    </div>

                    {/* Cited Policy Chips */}
                    {agentInvestigation.output.policy_citations.length > 0 && (
                      <div className="flex items-center gap-2 pt-1 text-xs">
                        <span className="font-bold text-slate-500">Cited Knowledge:</span>
                        {agentInvestigation.output.policy_citations.map((cite) => (
                          <span
                            key={cite}
                            className="bg-blue-50 text-[#0C83FF] font-mono text-[11px] font-bold px-2.5 py-0.5 rounded border border-blue-200"
                          >
                            {cite}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Executing agent investigation trace...</p>
                )}
              </div>

              {/* 3. Human-in-the-Loop Governance Panel */}
              <div className="fin-card p-5 bg-white">
                <span className="text-xs font-bold text-[#0C2340] uppercase tracking-wider block mb-1">
                  Finance Controller Sign-Off & Governance
                </span>
                <p className="text-xs text-slate-500 mb-3">
                  Approvals are cryptographically anchored with SHA-256 hash chaining into the compliance audit log.
                </p>

                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Review justification / contract addendum reference / manual override notes..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0C83FF] bg-slate-50"
                  rows={2}
                />

                {actionFeedback && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{actionFeedback}</span>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-end gap-2.5">
                  <button
                    onClick={() => handleReviewAction("REJECT")}
                    disabled={submittingAction}
                    className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Reject Record
                  </button>

                  <button
                    onClick={() => handleReviewAction("REQUEST_REVIEW")}
                    disabled={submittingAction}
                    className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Request Ops Inquiry
                  </button>

                  <button
                    onClick={() => handleReviewAction("APPROVE")}
                    disabled={submittingAction}
                    className="px-5 py-2 text-xs font-bold text-white bg-[#0C83FF] hover:bg-[#0266CC] rounded-xl shadow-sm transition-colors disabled:opacity-50"
                  >
                    {submittingAction ? "Signing Audit..." : "Approve & Resolve"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dispute Package Modal */}
      <DisputePackageModal
        transactionId={transactionId}
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
      />
    </div>
  );
};
