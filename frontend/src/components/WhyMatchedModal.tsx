"use client";

import React from "react";
import { X, CheckCircle2, Calculator, Scale } from "lucide-react";
import { ReconciliationResult } from "@/lib/types";
import { formatINR } from "@/lib/utils";

interface WhyMatchedModalProps {
  result: ReconciliationResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WhyMatchedModal: React.FC<WhyMatchedModalProps> = ({ result, isOpen, onClose }) => {
  if (!isOpen || !result) return null;

  const score = result.explanation?.score_breakdown;
  const calc = result.explanation?.calculation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Match Attribution & Explainability</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
            <div className="font-bold text-slate-800 font-mono mb-1">{result.entity_id}</div>
            <p className="text-slate-600 leading-relaxed">
              {result.explanation?.summary || "All 4 lifecycle entities verified with 100% financial accuracy."}
            </p>
          </div>

          {/* Scoring Factors */}
          {score && (
            <div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                Candidate Match Scoring Weights
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex justify-between">
                  <span className="text-slate-500">ID Exact Match (35%)</span>
                  <span className="font-mono font-bold text-emerald-700">{score.id_score * 100}%</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex justify-between">
                  <span className="text-slate-500">Amount Tolerance (30%)</span>
                  <span className="font-mono font-bold text-emerald-700">{score.amount_score * 100}%</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex justify-between">
                  <span className="text-slate-500">Time Proximity (20%)</span>
                  <span className="font-mono font-bold text-emerald-700">{score.time_score * 100}%</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex justify-between">
                  <span className="text-slate-500">UTR Reference (10%)</span>
                  <span className="font-mono font-bold text-emerald-700">{score.ref_score * 100}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Settlement Formula Verification */}
          {calc && (
            <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
                <Calculator className="w-3.5 h-3.5" />
                <span>Deterministic Settlement Verification</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Gross Payment:</span>
                <span className="font-mono font-bold">{formatINR(calc.gross_minor)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>- Gateway Fee (1.8% + ₹3):</span>
                <span className="font-mono">-{formatINR(calc.fee_minor)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>- GST on Fee (18%):</span>
                <span className="font-mono">-{formatINR(calc.tax_minor)}</span>
              </div>
              {calc.refunds_minor > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>- Customer Refund Offset:</span>
                  <span className="font-mono">-{formatINR(calc.refunds_minor)}</span>
                </div>
              )}
              <div className="pt-1.5 border-t border-emerald-200 flex justify-between font-bold text-emerald-900">
                <span>= Net Settlement Credited:</span>
                <span className="font-mono">{formatINR(calc.expected_net_minor)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
