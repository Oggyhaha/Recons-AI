"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, RefreshCw, Layers, CheckCircle2, ChevronDown, UserCheck, Zap } from "lucide-react";
import { api } from "@/lib/api";

interface NavbarProps {
  onBatchGenerated?: () => void;
  activeRole?: string;
  onRoleChange?: (role: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onBatchGenerated,
  activeRole = "FINANCE_CONTROLLER",
  onRoleChange,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  // Click outside listener to automatically close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setRoleMenuOpen(false);
      }
    };

    if (roleMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [roleMenuOpen]);

  const handleRunBatch = async () => {
    try {
      setIsGenerating(true);
      await api.generateBatch(500, 0.15);
      if (onBatchGenerated) onBatchGenerated();
    } catch (err) {
      console.error("Failed to generate batch:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const roles = [
    { id: "FINANCE_CONTROLLER", label: "Finance Controller", desc: "Full approvals & controls" },
    { id: "FINANCE_ANALYST", label: "Finance Analyst", desc: "Investigation & Q&A" },
    { id: "AUDITOR", label: "Compliance Auditor", desc: "Read-only & provenance logs" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-16 flex items-center justify-between">
        {/* Brand & Connected Gateway Info */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#0C2340] flex items-center justify-center text-white shadow-sm ring-1 ring-slate-900/10 transition-transform group-hover:scale-105">
              <ShieldCheck className="w-5 h-5 text-[#3395FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-[#0C2340] tracking-tight text-lg">ReconOS</span>
                <span className="text-[10px] font-bold bg-blue-50 text-[#0C83FF] border border-blue-200/80 px-2 py-0.5 rounded-md font-mono">
                  ENTERPRISE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Razorpay Settlement & Ledger Control Plane
              </p>
            </div>
          </Link>

          {/* Connected Gateway Badge - Enterprise FinTech styling */}
          <div className="hidden lg:flex items-center gap-2.5 pl-4 border-l border-slate-200">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200/80 text-[11px] font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Razorpay Production Gateway</span>
            </div>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-600">
              Continuous Ledger Integrity & Settlement Verification
            </span>
          </div>
        </div>

        {/* Action Controls & User Persona */}
        <div className="flex items-center gap-3">
          {/* Deterministic Verification Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Deterministic Engine Active</span>
          </div>

          {/* Persona Switcher with Click Outside Dropdown */}
          <div className="relative" ref={roleMenuRef}>
            <button
              onClick={() => setRoleMenuOpen((prev) => !prev)}
              aria-expanded={roleMenuOpen}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                roleMenuOpen
                  ? "border-[#0C83FF] ring-2 ring-blue-100 bg-blue-50/50 text-[#0C2340]"
                  : "border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline font-normal text-slate-500">Persona:</span>
              <span className="font-bold text-[#0C2340]">
                {roles.find((r) => r.id === activeRole)?.label || activeRole}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${roleMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-fin-elevated py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Operational Persona
                </div>
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      if (onRoleChange) onRoleChange(r.id);
                      setRoleMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-start gap-2.5 transition-colors"
                  >
                    <div className="pt-0.5">
                      {activeRole === r.id ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0C83FF]" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{r.label}</div>
                      <div className="text-[11px] text-slate-500">{r.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick 500-Batch Run Action - Razorpay Blue CTA */}
          <button
            onClick={handleRunBatch}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0C83FF] hover:bg-[#0266CC] active:bg-[#0C2340] text-white rounded-lg text-xs font-bold shadow-sm transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
            <span>{isGenerating ? "Reconciling Pipeline..." : "Run 500-Batch FinSim"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
