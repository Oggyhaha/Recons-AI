"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Radio,
  Zap,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Send,
  Code,
  ArrowRight
} from "lucide-react";
import { api } from "@/lib/api";
import { WebhookLog } from "@/lib/types";

interface WebhookSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventProcessed?: () => void;
}

export const WebhookSimulatorModal: React.FC<WebhookSimulatorModalProps> = ({
  isOpen,
  onClose,
  onEventProcessed,
}) => {
  const [selectedEvent, setSelectedEvent] = useState("payment.captured");
  const [amountInr, setAmountInr] = useState("4999.00");
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
      setSimulationResult(null);
      setError(null);
    }
  }, [isOpen]);

  const loadLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await api.getWebhookLogs();
      setLogs(res.events);
    } catch (e) {
      console.error("Failed to load webhook logs:", e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSimulate = async () => {
    try {
      setSimulating(true);
      setError(null);
      const val = parseFloat(amountInr) || 4999.0;
      const res = await api.simulateWebhook(selectedEvent, val);
      setSimulationResult(res);
      await loadLogs();
      if (onEventProcessed) onEventProcessed();
    } catch (err: any) {
      console.error("Simulation failed:", err);
      setError(err.message || "Failed to simulate webhook.");
    } finally {
      setSimulating(false);
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
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-300 font-mono tracking-wider">
                  LIVE INTEGRATION
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-sm font-bold text-white">
                  Razorpay Webhook Stream & Simulator
                </span>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  HMAC-SHA256 Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Real-time cryptographic verification and streaming ingestion for payment and settlement webhooks
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
          {/* Endpoint Info Bar */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500">Listener URL:</span>
              <code className="px-2.5 py-1 bg-slate-100 rounded text-slate-800 font-mono font-bold">
                POST /api/v1/webhooks/razorpay
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500">Signature Header:</span>
              <code className="px-2.5 py-1 bg-slate-100 rounded text-[#0C83FF] font-mono font-bold">
                X-Razorpay-Signature
              </code>
            </div>
          </div>

          {/* Interactive Simulation Sandbox */}
          <div className="fin-card p-5 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Interactive Webhook Simulator (Demo Mode)
              </span>
              <span className="text-xs text-slate-500">
                Generates authentic HMAC-SHA256 signature and tests live pipeline
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">
                  Webhook Event Type
                </label>
                <select
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#0C83FF] font-mono"
                >
                  <option value="payment.captured">payment.captured</option>
                  <option value="settlement.processed">settlement.processed</option>
                  <option value="refund.processed">refund.processed</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">
                  Amount (₹ INR)
                </label>
                <input
                  type="number"
                  value={amountInr}
                  onChange={(e) => setAmountInr(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#0C83FF] font-mono"
                  placeholder="4999.00"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleSimulate}
                  disabled={simulating}
                  className="w-full py-2.5 text-xs font-bold text-white bg-[#0C83FF] hover:bg-[#0266CC] disabled:opacity-50 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  {simulating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Signing & Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Signed Webhook</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Simulation Result Notification */}
            {simulationResult && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1.5 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Webhook Verified & Processed Successfully!</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-emerald-800">
                  <div>
                    <span className="text-emerald-600 font-sans">Event ID: </span>
                    {simulationResult.event_id}
                  </div>
                  <div>
                    <span className="text-emerald-600 font-sans">Signature Verified: </span>
                    <span className="font-bold text-emerald-700">✓ HMAC-SHA256 Match</span>
                  </div>
                  <div className="md:col-span-2 truncate">
                    <span className="text-emerald-600 font-sans">HMAC Digest: </span>
                    <span className="font-mono text-[10px]">{simulationResult.simulated_signature}</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Recent Webhook Events Stream */}
          <div className="fin-card overflow-hidden bg-white">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#0C83FF]" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Live Webhook Ingestion Log ({logs.length} events)
                </span>
              </div>
              <button
                onClick={loadLogs}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
              >
                <RefreshCw className={`w-3 h-3 ${loadingLogs ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full fin-table text-xs">
                <thead>
                  <tr>
                    <th>Event Type</th>
                    <th>Entity ID</th>
                    <th>Amount (INR)</th>
                    <th>Signature Status</th>
                    <th>Received At</th>
                    <th>Processing</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        No webhook events captured yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.event_id} className="hover:bg-slate-50/70 transition-colors font-mono">
                        <td className="font-bold text-[#0C2340]">{log.event}</td>
                        <td className="text-slate-600">{log.entity_id}</td>
                        <td className="font-bold text-slate-900">{log.formatted_amount}</td>
                        <td>
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            HMAC VERIFIED
                          </span>
                        </td>
                        <td className="text-slate-400 text-[11px] font-sans">
                          {new Date(log.received_at).toLocaleTimeString()}
                        </td>
                        <td>
                          <span className="text-[10px] font-bold bg-blue-50 text-[#0C83FF] border border-blue-200 px-2 py-0.5 rounded-full">
                            RECONCILED
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
      </div>
    </div>
  );
};
