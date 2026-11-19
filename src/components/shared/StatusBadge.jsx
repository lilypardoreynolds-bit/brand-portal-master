import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";

const statusConfig = {
  complete: { label: "Complete", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  in_progress: { label: "In Progress", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Loader2 },
  pending: { label: "Pending", color: "bg-slate-50 text-slate-500 border-slate-200", icon: Clock },
};

export default function StatusBadge({ status, size = "sm" }) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border font-medium",
      config.color,
      size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"
    )}>
      <Icon className={cn("flex-shrink-0", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      {config.label}
    </span>
  );
}