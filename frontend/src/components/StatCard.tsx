import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
  };
  highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  highlight = false,
}) => {
  return (
    <div
      className={cn(
        "fin-card p-5 relative overflow-hidden",
        highlight && "ring-1 ring-[#0C83FF]/30 bg-gradient-to-br from-white via-blue-50/20 to-white"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">{title}</span>
        {icon && <div className="p-2 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-600">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-black tracking-tight text-[#0C2340] font-mono">{value}</span>
        {trend && (
          <span
            className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full font-mono",
              trend.positive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1.5 text-xs text-slate-500 font-medium">{subtitle}</p>}
    </div>
  );
};
