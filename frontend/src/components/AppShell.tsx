"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { ShieldCheck, Lock } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!isLoading) {
      if (!user && !isLoginPage) {
        router.replace("/login");
      } else if (user && isLoginPage) {
        router.replace("/");
      }
    }
  }, [user, isLoading, isLoginPage, router]);

  // If on login page, render children alone without App Navbar or Sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  // If loading authentication state, show polished splash screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07101E] flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-white/95 border border-white/20 p-1 flex items-center justify-center shadow-xl shadow-blue-500/20 animate-pulse">
          <img
            src="/logo.png"
            alt="ReconOS Logo"
            className="w-full h-full object-contain rounded-xl"
          />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold tracking-tight">Recon<span className="text-blue-400">OS</span></h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            <span>Verifying Finance Controller session...</span>
          </p>
        </div>
      </div>
    );
  }

  // If unauthenticated and not on login page, block access and wait for redirect
  if (!user) {
    return (
      <div className="min-h-screen bg-[#07101E] flex flex-col items-center justify-center text-white space-y-3">
        <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-xs text-slate-400">Redirecting to Secure Sign In...</p>
      </div>
    );
  }

  // Authenticated: Render complete Finance Controller control plane
  return (
    <div className="h-screen h-[100dvh] bg-slate-50 flex flex-col w-full max-w-full overflow-hidden">
      <Navbar />
      <div className="flex w-full flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 h-full min-w-0 overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-7 xl:p-8 w-full max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
