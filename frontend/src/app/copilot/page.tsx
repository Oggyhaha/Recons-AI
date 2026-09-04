"use client";

import React, { useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  FileText,
  Activity,
  ChevronRight,
  Database,
  Search,
  CheckCircle2,
  ShieldAlert,
  HelpCircle,
  TrendingUp,
  Cpu,
  User
} from "lucide-react";
import { api } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  toolsUsed?: string[];
  facts?: Record<string, any>;
}

export default function FinanceCopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "### Welcome to ReconOS Live AI Finance Copilot\n\n" +
        "I have real-time read access to your active **500-record financial ledger**, Razorpay settlement policies, bank statements, and cash positions.\n\n" +
        "You can ask me **any question** about:\n" +
        "- Specific transactions (e.g. `ORD-0015`, `ORD-0021`)\n" +
        "- MDR fee configuration overcharges & reconciliation\n" +
        "- Missing bank statement credits & delayed payouts\n" +
        "- 7-day cash flow forecasts & liquidity runway\n" +
        "- Safety guardrails & deterministic engine architecture",
      sources: ["POL-RZP-SETTLE-01", "POL-RZP-FEE-02"],
      toolsUsed: ["get_ledger_facts", "get_cash_position"],
      facts: {
        available_cash: "₹8,295,339.38",
        match_rate: "89.56%",
        cash_at_risk: "₹481,037.35",
      }
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    "Why is today's settlement lower than expected?",
    "Explain the MDR fee configuration discrepancy",
    "What happened with order ORD-0015?",
    "How much cash is currently uncredited by the bank?",
    "How does our AI work and what are the safety guardrails?"
  ];

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim()) return;

    const userMsg: Message = { role: "user", content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const res = await api.askCopilot(q);
      const botMsg: Message = {
        role: "assistant",
        content: res.answer,
        sources: res.sources,
        toolsUsed: res.tools_used,
        facts: res.financial_facts,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Failed to query copilot:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Encountered an issue querying the active financial dataset. Please verify the backend connection.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format bold and code tokens inside text lines
  const renderInlineStyles = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-bold text-[#0C2340]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 rounded bg-blue-50 font-mono text-[11px] text-[#0C83FF] font-bold border border-blue-200"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  // Structured Markdown Parser for Assistant Messages
  const renderFormattedMessage = (content: string) => {
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let isNumbered = false;

    const flushList = () => {
      if (listItems.length > 0) {
        if (isNumbered) {
          elements.push(
            <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-1.5 my-2 text-slate-700 pl-1">
              {listItems.map((item, i) => (
                <li key={i} className="text-xs leading-relaxed">
                  {renderInlineStyles(item)}
                </li>
              ))}
            </ol>
          );
        } else {
          elements.push(
            <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1.5 my-2 text-slate-700 pl-1">
              {listItems.map((item, i) => (
                <li key={i} className="text-xs leading-relaxed">
                  {renderInlineStyles(item)}
                </li>
              ))}
            </ul>
          );
        }
        listItems = [];
      }
    };

    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushList();
        return;
      }

      if (trimmed.startsWith("### ")) {
        flushList();
        elements.push(
          <h3
            key={lineIdx}
            className="text-sm font-bold text-[#0C2340] mt-3.5 mb-2 pb-1.5 border-b border-slate-100 flex items-center gap-2"
          >
            <span>{renderInlineStyles(trimmed.replace("### ", ""))}</span>
          </h3>
        );
      } else if (/^\d+\.\s+/.test(trimmed)) {
        if (!isNumbered && listItems.length > 0) flushList();
        isNumbered = true;
        listItems.push(trimmed.replace(/^\d+\.\s+/, ""));
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        if (isNumbered && listItems.length > 0) flushList();
        isNumbered = false;
        listItems.push(trimmed.replace(/^[-*]\s+/, ""));
      } else {
        flushList();
        elements.push(
          <p key={lineIdx} className="text-xs leading-relaxed text-slate-700 my-1.5">
            {renderInlineStyles(trimmed)}
          </p>
        );
      }
    });

    flushList();
    return elements;
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Top Banner Header */}
      <div className="fin-card p-6 bg-gradient-to-r from-white via-slate-50/50 to-white border-l-4 border-l-[#0C83FF] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-[#0C2340] tracking-tight">
              AI Finance Controller Copilot
            </h1>
            <span className="text-xs font-mono font-bold bg-blue-50 text-[#0C83FF] border border-blue-200 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#0C83FF]" />
              <span>LIVE DATASET GROUNDED</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
            Autonomous financial inquiry engine connected to active orders, payments, settlements, and bank credits with deterministic safety guardrails.
          </p>
        </div>

        {/* Active Guardrails Indicators */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Anti-Hallucination Barrier Active</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs">
            <ShieldAlert className="w-4 h-4 text-slate-500" />
            <span>Prompt Injection Shield</span>
          </div>
        </div>
      </div>

      {/* Main Chat Container Box */}
      <div className="fin-card flex flex-col h-[740px] overflow-hidden shadow-sm">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6 bg-slate-50/40">
          {messages.map((m, idx) => (
            <div key={idx} className="w-full">
              {m.role === "user" ? (
                /* USER MESSAGE: Clear, visible, high-contrast right-aligned box */
                <div className="flex items-start justify-end gap-3 w-full">
                  <div className="max-w-2xl bg-[#0C83FF] text-white px-5 py-3.5 rounded-2xl rounded-tr-xs shadow-sm text-xs font-semibold leading-relaxed whitespace-pre-wrap">
                    {m.content}
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-[#0C2340] text-white flex items-center justify-center shrink-0 shadow-sm text-xs font-mono font-bold ring-1 ring-slate-900/10">
                    YOU
                  </div>
                </div>
              ) : (
                /* ASSISTANT MESSAGE: Roomy white card with real HTML formatting */
                <div className="flex items-start justify-start gap-3 w-full">
                  <div className="w-9 h-9 rounded-xl bg-[#0C2340] text-white flex items-center justify-center shrink-0 shadow-sm ring-1 ring-slate-900/10">
                    <Bot className="w-5 h-5 text-[#3395FF]" />
                  </div>

                  <div className="max-w-4xl flex-1 bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-6 shadow-sm">
                    {/* Rendered Body with Generous Margins */}
                    <div className="space-y-1">
                      {renderFormattedMessage(m.content)}
                    </div>

                    {/* Grounding & Evidence Footer */}
                    {(m.sources || m.toolsUsed || m.facts) && (
                      <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                        {/* Live Financial Facts Pills */}
                        {m.facts && Object.keys(m.facts).length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                              Ledger Facts:
                            </span>
                            {Object.entries(m.facts).map(([k, v]) => (
                              <span
                                key={k}
                                className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg font-mono text-[11px] text-slate-700 shadow-2xs"
                              >
                                <span className="text-slate-400">{k.replace(/_/g, " ")}: </span>
                                <span className="font-bold text-[#0C2340]">{String(v)}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          {/* Tools Executed */}
                          {m.toolsUsed && m.toolsUsed.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Database className="w-4 h-4 text-[#0C83FF]" />
                              <span className="font-semibold text-slate-600">Tools:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {m.toolsUsed.map((tool) => (
                                  <span
                                    key={tool}
                                    className="font-mono text-[11px] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md text-[#0C83FF] font-bold"
                                  >
                                    {tool}()
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Policy Citations */}
                          {m.sources && m.sources.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <FileText className="w-4 h-4 text-slate-600" />
                              <span className="font-semibold text-slate-600">Cited Policies:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {m.sources.map((src) => (
                                  <span
                                    key={src}
                                    className="font-mono text-[11px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-bold"
                                  >
                                    {src}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3 w-full">
              <div className="w-9 h-9 rounded-xl bg-[#0C2340] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-5 h-5 text-[#3395FF]" />
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-700 flex items-center gap-3 shadow-2xs font-semibold">
                <div className="w-3 h-3 rounded-full bg-[#0C83FF] animate-ping" />
                <span>Querying ledger facts, verifying policies & synthesizing response...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts Strip */}
        <div className="px-6 py-3.5 border-t border-slate-200/80 bg-slate-50/70 flex items-center gap-2.5 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Suggested Prompts:
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="text-xs text-slate-700 bg-white hover:bg-blue-50 hover:text-[#0C83FF] hover:border-blue-200 border border-slate-200 px-3.5 py-1.5 rounded-full whitespace-nowrap shadow-2xs transition-all shrink-0 font-medium"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 lg:p-5 border-t border-slate-200 bg-white flex items-center gap-3">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything: 'What happened with ORD-0015?', 'Explain MDR fee discrepancy', 'How much cash is uncredited?'..."
            className="flex-1 text-xs p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0C83FF] bg-slate-50/50 font-medium"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !inputQuery.trim()}
            className="px-6 py-3.5 bg-[#0C83FF] hover:bg-[#0266CC] disabled:opacity-50 text-white rounded-xl shadow-sm transition-colors font-bold flex items-center gap-2 text-xs"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
