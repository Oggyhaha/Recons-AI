"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileSpreadsheet,
  AlertTriangle,
  Wallet,
  Bot,
  Award,
  History,
  ShieldCheck,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  exceptionCount?: number;
  matchRate?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ exceptionCount = 39, matchRate = 92.2 }) => {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Control Center",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      label: "Reconciliation",
      href: "/reconciliation",
      icon: FileSpreadsheet,
      badge: `${matchRate}%`,
    },
    {
      label: "Exception Queue",
      href: "/exceptions",
      icon: AlertTriangle,
      badge: exceptionCount.toString(),
      badgeVariant: "rose",
    },
    {
      label: "Cash Intelligence",
      href: "/cash",
      icon: Wallet,
    },
    {
      label: "AI Finance Copilot",
      href: "/copilot",
      icon: Bot,
      badge: "LIVE",
      badgeVariant: "razorpay",
    },
    {
      label: "Benchmark & Truth",
      href: "/benchmark",
      icon: Award,
    },
    {
      label: "Audit & Provenance",
      href: "/audit",
      icon: History,
    },
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col justify-between bg-white border-r border-slate-200/90 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4 self-start">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Financial Operations
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group",
                isActive
                  ? "bg-[#0C2340] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-[#3395FF]" : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold",
                    isActive
                      ? "bg-white/15 text-white border border-white/20"
                      : item.badgeVariant === "rose"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : item.badgeVariant === "razorpay"
                      ? "bg-blue-50 text-[#0C83FF] border border-blue-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Razorpay Settlement & Compliance Card */}
      <div className="pt-4 border-t border-slate-100">
        <div className="rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0C2340]">
            <ShieldCheck className="w-4 h-4 text-[#0C83FF]" />
            <span>Razorpay Policy Guard</span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
            MDR 1.80% + ₹3.00, GST 18%, T+2 settlement calendar enforced deterministically with zero hallucination.
          </p>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200/80 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>LEDGER VERIFIED</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
