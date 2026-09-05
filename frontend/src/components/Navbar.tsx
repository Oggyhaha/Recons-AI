"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  FileSpreadsheet,
  AlertTriangle,
  Wallet,
  Bot,
  Award,
  History,
  Building,
  Briefcase
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onBatchGenerated?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onBatchGenerated }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [isGenerating, setIsGenerating] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Click outside listener to automatically close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuOpen]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

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

  const handleLogout = () => {
    logout();
    setProfileMenuOpen(false);
    setMobileDrawerOpen(false);
    router.replace("/login");
  };

  const navItems = [
    { label: "Control Center", href: "/", icon: LayoutDashboard },
    { label: "Reconciliation", href: "/reconciliation", icon: FileSpreadsheet, badge: "92.2%" },
    { label: "Exception Queue", href: "/exceptions", icon: AlertTriangle, badge: "39", badgeVariant: "rose" },
    { label: "Cash Intelligence", href: "/cash", icon: Wallet },
    { label: "AI Finance Copilot", href: "/copilot", icon: Bot, badge: "LIVE", badgeVariant: "blue" },
    { label: "Benchmark & Truth", href: "/benchmark", icon: Award },
    { label: "Audit & Provenance", href: "/audit", icon: History },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs">
        <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-10 h-16 flex items-center justify-between">
          {/* Brand & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="p-2 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg md:hidden transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-slate-200/90 p-0.5 flex items-center justify-center shadow-xs ring-1 ring-slate-900/5 transition-transform group-hover:scale-105 shrink-0 overflow-hidden">
                <img
                  src="/logo.png"
                  alt="ReconOS Logo"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-black text-[#0C2340] tracking-tight text-base sm:text-lg">ReconOS</span>
                  <span className="text-[9px] sm:text-[10px] font-bold bg-blue-50 text-[#0C83FF] border border-blue-200/80 px-1.5 py-0.5 rounded font-mono">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                  Razorpay Settlement & Ledger Control Plane
                </p>
              </div>
            </Link>

            {/* Connected Gateway Badge - Desktop */}
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
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Deterministic Verification Pill - Tablet+ */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] sm:text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">Deterministic Engine</span> Active
            </div>

            {/* Finance Controller User Badge with Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                aria-expanded={profileMenuOpen}
                className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  profileMenuOpen
                    ? "border-[#0C83FF] ring-2 ring-blue-100 bg-blue-50/50 text-[#0C2340]"
                    : "border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "C"}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-bold text-[#0C2340] leading-none">{user?.name || "Sarah Chen, CPA"}</div>
                  <div className="text-[10px] text-blue-600 font-semibold mt-0.5">Finance Controller</div>
                </div>
                <span className="sm:hidden font-bold text-[#0C2340]">Controller</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                    <div className="font-bold text-xs text-slate-900">{user?.name || "Sarah Chen, CPA"}</div>
                    <div className="text-[11px] text-slate-500 font-medium truncate">{user?.email || "controller@razorpay-merchant.com"}</div>
                    <div className="flex items-center gap-1 mt-2 text-[10px] font-semibold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded border border-blue-200/60">
                      <Building className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="truncate">{user?.tenant_name || "Enterprise Retail Tech Ltd"}</span>
                    </div>
                  </div>

                  <div className="px-4 py-2.5 space-y-1.5 text-xs text-slate-600 border-b border-slate-100">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Role:</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-blue-600" />
                        Finance Controller
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Authority:</span>
                      <span className="font-semibold text-emerald-700">Full Sign-off & Write-off</span>
                    </div>
                  </div>

                  <div className="pt-1 px-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 font-bold transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Batch CTA Button */}
            <button
              onClick={handleRunBatch}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-[#0C83FF] hover:bg-[#0266CC] active:bg-[#0C2340] text-white rounded-lg text-xs font-bold shadow-sm transition-all disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{isGenerating ? "Reconciling..." : "Run 500-Batch FinSim"}</span>
              <span className="sm:hidden">{isGenerating ? "..." : "Simulate"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Visible on < 768px when toggled) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="fixed inset-y-0 left-0 w-[84%] max-w-xs bg-white shadow-2xl z-50 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-200 border-r border-slate-200">
            <div>
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <Link
                  href="/"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/90 p-0.5 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                    <img
                      src="/logo.png"
                      alt="ReconOS Logo"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-[#0C2340] text-base">ReconOS</span>
                      <span className="text-[9px] font-bold bg-blue-50 text-[#0C83FF] border border-blue-200/80 px-1 py-0.2 rounded font-mono">
                        PRO
                      </span>
                    </div>
                  </div>
                </Link>

                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Finance Controller Card inside Mobile Drawer */}
              <div className="p-3.5 mx-3 mt-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "C"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-900 truncate">{user?.name || "Sarah Chen, CPA"}</div>
                    <div className="text-[10px] text-slate-500 font-medium truncate">{user?.email || "controller@razorpay-merchant.com"}</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Role:</span>
                  <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-[10px]">
                    FINANCE CONTROLLER
                  </span>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="px-3 py-3 space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Operations Navigation
                </div>
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                        isActive
                          ? "bg-[#0C2340] text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={cn(
                            "w-4 h-4",
                            isActive ? "text-[#3395FF]" : "text-slate-400"
                          )}
                        />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono",
                            isActive
                              ? "bg-blue-500/30 text-blue-200 border border-blue-400/30"
                              : item.badgeVariant === "rose"
                              ? "bg-rose-50 text-rose-600 border border-rose-200"
                              : "bg-blue-50 text-[#0C83FF] border border-blue-200"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
              <button
                onClick={() => {
                  handleRunBatch();
                  setMobileDrawerOpen(false);
                }}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#0C83FF] text-white rounded-xl text-xs font-bold shadow-sm active:bg-[#0266CC]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                <span>{isGenerating ? "Simulating..." : "Run 500-Batch FinSim"}</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
