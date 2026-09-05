"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile } from "@/lib/types";
import { api } from "@/lib/api";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; role?: string; tenant_name?: string }) => Promise<void>;
  logout: () => void;
  switchRole: (role: string) => Promise<void>;
}

const DEFAULT_DEMO_USER: UserProfile = {
  user_id: "usr_controller_01",
  name: "Sarah Chen, CPA",
  email: "controller@razorpay-merchant.com",
  role: "FINANCE_CONTROLLER",
  tenant_id: "mid_razorpay_ent_001",
  tenant_name: "Enterprise Retail Tech Ltd",
  permissions: [
    "RECONCILIATION_RUN",
    "EXCEPTION_APPROVE",
    "EXCEPTION_FORCE_MATCH",
    "EXCEPTION_WRITE_OFF",
    "DISPUTE_GENERATE",
    "ERP_JOURNAL_EXPORT",
    "CASH_TREASURY_VIEW",
    "AUDIT_PROVENANCE_VIEW"
  ]
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("reconos_auth_user");
      const storedToken = localStorage.getItem("reconos_auth_token");
      const loggedOut = localStorage.getItem("reconos_logged_out");

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } else if (!loggedOut) {
        // Pre-seed default demo account for seamless first-run experience
        setUser(DEFAULT_DEMO_USER);
        setToken("mock_jwt_token_usr_controller_01");
        localStorage.setItem("reconos_auth_user", JSON.stringify(DEFAULT_DEMO_USER));
        localStorage.setItem("reconos_auth_token", "mock_jwt_token_usr_controller_01");
      }
    } catch (e) {
      console.error("Failed to restore auth session:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      setUser(res.user);
      setToken(res.access_token);
      localStorage.setItem("reconos_auth_user", JSON.stringify(res.user));
      localStorage.setItem("reconos_auth_token", res.access_token);
      localStorage.removeItem("reconos_logged_out");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    name: string;
    role?: string;
    tenant_name?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      setUser(res.user);
      setToken(res.access_token);
      localStorage.setItem("reconos_auth_user", JSON.stringify(res.user));
      localStorage.setItem("reconos_auth_token", res.access_token);
      localStorage.removeItem("reconos_logged_out");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("reconos_auth_user");
    localStorage.removeItem("reconos_auth_token");
    localStorage.setItem("reconos_logged_out", "true");
  };

  const switchRole = async (role: string) => {
    try {
      const res = await api.switchRole(role, token || undefined);
      setUser(res.user);
      localStorage.setItem("reconos_auth_user", JSON.stringify(res.user));
    } catch (e) {
      // Fallback local update if network is unavailable
      if (user) {
        const updated = { ...user, role };
        setUser(updated);
        localStorage.setItem("reconos_auth_user", JSON.stringify(updated));
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
