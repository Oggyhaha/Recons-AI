"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building,
  ArrowRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Briefcase
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();

  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("controller@razorpay-merchant.com");
  const [password, setPassword] = useState("password123");
  const [name, setName] = useState("");
  const [tenantName, setTenantName] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      await login(email, password);
      setSuccessMessage("Finance Controller authenticated! Unlocking Control Plane...");
      setTimeout(() => {
        router.replace("/");
      }, 500);
    } catch (err: any) {
      setErrorMessage(err?.message || "Invalid credentials. Please verify your work email and password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      await register({
        email,
        password,
        name,
        tenant_name: tenantName || undefined,
      });
      setSuccessMessage("Finance Controller account created! Unlocking Control Plane...");
      setTimeout(() => {
        router.replace("/");
      }, 500);
    } catch (err: any) {
      setErrorMessage(err?.message || "Registration failed. Email may already be registered.");
    } finally {
      setIsLoading(false);
    }
  };

  const handle1ClickControllerLogin = async () => {
    setEmail("controller@razorpay-merchant.com");
    setPassword("password123");
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await login("controller@razorpay-merchant.com", "password123");
      setSuccessMessage("Authenticated as Finance Controller! Redirecting...");
      setTimeout(() => {
        router.replace("/");
      }, 400);
    } catch (err: any) {
      setErrorMessage(err?.message || "Authentication failed. Please check connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen h-[100dvh] overflow-y-auto bg-[#07101E] text-slate-100 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 relative">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-blue-600/15 via-cyan-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-6">
        <div className="inline-flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/95 border border-white/20 p-1 flex items-center justify-center shadow-xl shadow-blue-500/20 backdrop-blur-md shrink-0">
            <img
              src="/logo.png"
              alt="ReconOS Logo"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <div className="text-left">
            <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
              Recon<span className="text-blue-400">OS</span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                PRO
              </span>
            </span>
            <p className="text-xs text-slate-400 font-medium">Finance Controller Control Plane</p>
          </div>
        </div>
        <h2 className="mt-5 text-2xl font-bold tracking-tight text-white">
          {tab === "login" ? "Finance Controller Sign In" : "Register Finance Controller"}
        </h2>
        <p className="mt-1.5 text-xs text-slate-400">
          Sign in required to access reconciliation runs, case rooms, dispute memos & cash intelligence.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#0D1B2E]/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7">
          {/* Tab Switcher */}
          <div className="flex border-b border-slate-800 pb-3 mb-5">
            <button
              onClick={() => {
                setTab("login");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
                tab === "login"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab("register");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
                tab === "register"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Forms */}
          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Controller Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="controller@razorpay-merchant.com"
                    className="w-full bg-[#07101E] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#07101E] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Control Plane</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Controller Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sarah Chen, CPA"
                    className="w-full bg-[#07101E] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Merchant / Company Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="Enterprise Retail Tech Ltd"
                    className="w-full bg-[#07101E] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="controller@company.com"
                    className="w-full bg-[#07101E] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-[#07101E] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/50 flex items-center justify-between text-xs">
                <span className="text-slate-400">Assigned Role:</span>
                <span className="font-bold text-blue-300 font-mono">Finance Controller (Full Access)</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Controller Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Enterprise Single Sign-On / Fast Access for Finance Controller */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enterprise Single Sign-On (SSO)</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
              Authenticate directly with certified Finance Controller credentials:
            </p>

            <button
              type="button"
              onClick={handle1ClickControllerLogin}
              disabled={isLoading}
              className="w-full p-3.5 rounded-xl bg-gradient-to-r from-blue-900/60 to-blue-950/80 hover:from-blue-800/80 hover:to-blue-900 border border-blue-700/60 hover:border-blue-500 transition-all flex items-center justify-between group shadow-lg shadow-blue-900/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white group-hover:text-blue-200 flex items-center gap-1.5">
                    <span>Sign In as Finance Controller</span>
                    <span className="text-[9px] bg-emerald-600/90 text-white px-2 py-0.5 rounded font-mono font-bold">
                      ENTERPRISE
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    controller@razorpay-merchant.com &bull; Enterprise Retail Tech Ltd
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-5">
          &copy; 2026 ReconOS &bull; Autonomous Finance Operations for Razorpay Merchants
        </p>
      </div>
    </div>
  );
}
