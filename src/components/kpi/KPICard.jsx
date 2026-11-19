import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function KPICard({ label, value, unit = "", prefix = "", trend, trendLabel, icon: Icon, color = "bg-indigo-500", iconColor = "text-indigo-600", bgLight = "bg-indigo-50" }) {
  const trendIcon =
    trend > 0 ? <TrendingUp className="h-3.5 w-3.5" /> :
    trend < 0 ? <TrendingDown className="h-3.5 w-3.5" /> :
    <Minus className="h-3.5 w-3.5" />;

  const trendColor =
    trend > 0 ? "text-emerald-600" :
    trend < 0 ? "text-red-500" :
    "text-slate-400";

  return (
    <Card className="border-slate-200 hover:shadow-sm transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", bgLight)}>
            {Icon && <Icon className={cn("h-5 w-5", iconColor)} />}
          </div>
          {trend !== undefined && (
            <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
              {trendIcon}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-slate-900">
          {prefix}{typeof value === "number" ? value.toLocaleString() : value}{unit}
        </p>
        <p className="text-xs text-slate-500 mt-1">{label}</p>
        {trendLabel && <p className="text-xs text-slate-400 mt-0.5">{trendLabel}</p>}
      </CardContent>
    </Card>
  );
}