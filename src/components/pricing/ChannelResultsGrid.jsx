import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { calcChannels } from "./pricingCalc";
import { TrendingUp, ShieldCheck } from "lucide-react";

function fmt(n) { return n >= 0 ? `$${n.toFixed(2)}` : `-$${Math.abs(n).toFixed(2)}`; }
function pct(n) { return `${n.toFixed(1)}%`; }

function Row({ label, value, neg, highlight }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={cn(
        "text-xs font-medium",
        highlight ? "text-slate-800 font-semibold" : neg ? "text-red-500" : "text-slate-700"
      )}>{value}</span>
    </div>
  );
}

export default function ChannelResultsGrid({ scenario }) {
  const channels = calcChannels(scenario);

  const maxProfit = Math.max(...channels.map(c => c.profit));
  const maxMargin = Math.max(...channels.map(c => c.margin));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {channels.map((ch) => {
        const isBestProfit = ch.profit === maxProfit && ch.profit > 0;
        const isLowRisk = ch.margin === maxMargin && ch.margin > 0 && !isBestProfit;
        const profitColor = ch.profit >= 0 ? "text-emerald-600" : "text-red-600";
        const marginColor = ch.margin >= 30 ? "text-emerald-600" : ch.margin >= 15 ? "text-amber-600" : "text-red-600";
        const borderColor = ch.profit < 0 ? "border-red-200" : ch.margin >= 30 ? "border-emerald-200" : ch.margin >= 15 ? "border-amber-200" : "border-slate-200";

        return (
          <Card key={ch.key} className={cn("border-2 relative", borderColor)}>
            <CardContent className="p-4">
              {/* Badges */}
              <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                {isBestProfit && (
                  <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-300 gap-1 text-[10px] px-1.5 py-0.5">
                    <TrendingUp className="h-3 w-3" /> Best Profit
                  </Badge>
                )}
                {isLowRisk && (
                  <Badge className="bg-blue-100 text-blue-700 border border-blue-300 gap-1 text-[10px] px-1.5 py-0.5">
                    <ShieldCheck className="h-3 w-3" /> Low Risk
                  </Badge>
                )}
              </div>

              <p className="text-sm font-bold text-slate-800 pr-20 mb-4">{ch.label}</p>

              <div className="space-y-2">
                <Row label="Revenue" value={fmt(ch.revenue)} highlight />
                <div className="border-t border-dashed border-slate-200 pt-2 mt-1">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Importation</p>
                  <Row label="Landed Cost" value={`-${fmt(ch.landed)}`} neg />
                </div>
                <div className="border-t border-dashed border-slate-200 pt-2 mt-1">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">OPS</p>
                  <Row label="Mgmt + OPEX + MKT (25%)" value={`-${fmt(ch.ops)}`} neg />
                  {ch.key !== "amazon" && <Row label="Processing Fee (3.5%)" value={`-${fmt(ch.processingFee)}`} neg />}
                  {ch.key === "shopify" && ch.opsExtraCosts > 0 && <Row label="OPS Extra Costs" value={`-${fmt(ch.opsExtraCosts)}`} neg />}
                  {ch.key === "shopify" && (
                    <p className="text-[10px] text-amber-600 italic mt-1">* Shipping cost not included — variable</p>
                  )}
                </div>
                {ch.channelFee > 0 && (
                  <div className="border-t border-dashed border-slate-200 pt-2 mt-1">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Channel Fee</p>
                    <Row label="Amazon FBA" value={`-${fmt(ch.channelFee)}`} neg />
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2 mt-2" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Net Profit</span>
                  <span className={cn("text-base font-bold", profitColor)}>{fmt(ch.profit)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-slate-400">Margin</p>
                    <p className={cn("text-sm font-bold", marginColor)}>{pct(ch.margin)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-slate-400">ROI</p>
                    <p className={cn("text-sm font-bold", ch.roi >= 0 ? "text-indigo-600" : "text-red-600")}>{pct(ch.roi)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}