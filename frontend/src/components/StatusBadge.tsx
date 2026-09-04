import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, size = "md" }) => {
  let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
  let dotStyle = "bg-slate-400";

  switch (status) {
    case "MATCHED":
    case "RESOLVED":
    case "EXACT_RECONCILED":
    case "COMPLETED":
    case "ACTIVE":
    case "VALIDATED":
      badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      dotStyle = "bg-emerald-500";
      break;
    case "PARTIAL_MATCH":
    case "PARTIAL_SETTLEMENT":
    case "TIMING_VARIANCE":
    case "WAITING_HUMAN":
    case "INVESTIGATING":
    case "MEDIUM":
    case "LOW":
      badgeStyle = "bg-amber-50 text-amber-700 border-amber-200/80";
      dotStyle = "bg-amber-500";
      break;
    case "AMOUNT_MISMATCH":
    case "MISSING_PAYMENT":
    case "MISSING_SETTLEMENT":
    case "MISSING_BANK_CREDIT":
    case "FEE_MISMATCH":
    case "TAX_MISMATCH":
    case "DUPLICATE":
    case "CRITICAL":
    case "HIGH":
    case "REJECTED":
    case "UNRESOLVED":
    case "AMBIGUOUS_MATCH":
      badgeStyle = "bg-rose-50 text-rose-700 border-rose-200/80";
      dotStyle = "bg-rose-500";
      break;
    case "OPEN":
      badgeStyle = "bg-blue-50 text-blue-700 border-blue-200/80";
      dotStyle = "bg-blue-500";
      break;
  }

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-medium";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border shadow-sm tracking-wide uppercase font-mono",
        sizeClasses,
        badgeStyle,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotStyle)} />
      {status.replace(/_/g, " ")}
    </span>
  );
};
