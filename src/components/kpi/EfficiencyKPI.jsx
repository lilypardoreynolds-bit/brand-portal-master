import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, RefreshCw, Wallet, TrendingUp, Plus } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts";
import KPICard from "./KPICard";
import ManualEntryDialog from "./ManualEntryDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

function getLatest(entries, metric) {
  const filtered = entries.filter((e) => e.metric === metric).sort((a, b) => b.period.localeCompare(a.period));
  return filtered[0]?.value ?? null;
}

function getMetricValues(entries, metric) {
  return entries
    .filter((e) => e.metric === metric)
    .sort((a, b) => a.period.localeCompare(b.period))
    .map((e) => ({ date: e.period, value: e.value }));
}

function calcTrend(entries, metric) {
  const sorted = entries.filter((e) => e.metric === metric).sort((a, b) => b.period.localeCompare(a.period));
  if (sorted.length < 2) return undefined;
  const [curr, prev] = [sorted[0].value, sorted[1].value];
  if (!prev) return undefined;
  return Math.round(((curr - prev) / prev) * 100);
}

export default function EfficiencyKPI({ entries = [] }) {
  const [showEntry, setShowEntry] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.KPIEntry.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kpi_entries"] }),
  });

  const effEntries = entries.filter((e) => e.category === "efficiency");
  const fulfillTime = getLatest(effEntries, "Order Fulfillment Time (hrs)");
  const turnover = getLatest(effEntries, "Inventory Turnover Rate");
  const opCosts = getLatest(effEntries, "Operational Costs");
  const profitMargin = getLatest(effEntries, "Profit Margin (%)");

  const costsData = getMetricValues(effEntries, "Operational Costs");
  const marginData = getMetricValues(effEntries, "Profit Margin (%)");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-violet-500 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Efficiency</h3>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowEntry(true)}>
          <Plus className="h-3.5 w-3.5" /> Add Data
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Fulfillment Time" value={fulfillTime ?? "—"} unit={fulfillTime !== null ? " hrs" : ""} icon={Clock} trend={calcTrend(effEntries, "Order Fulfillment Time (hrs)")} bgLight="bg-violet-50" iconColor="text-violet-600" trendLabel="Lower is better" />
        <KPICard label="Inventory Turnover" value={turnover ?? "—"} unit={turnover !== null ? "x" : ""} icon={RefreshCw} trend={calcTrend(effEntries, "Inventory Turnover Rate")} bgLight="bg-cyan-50" iconColor="text-cyan-600" />
        <KPICard label="Operational Costs" value={opCosts ?? "—"} prefix={opCosts !== null ? "$" : ""} icon={Wallet} trend={calcTrend(effEntries, "Operational Costs")} bgLight="bg-rose-50" iconColor="text-rose-600" />
        <KPICard label="Profit Margin" value={profitMargin ?? "—"} unit={profitMargin !== null ? "%" : ""} icon={TrendingUp} trend={calcTrend(effEntries, "Profit Margin (%)")} bgLight="bg-emerald-50" iconColor="text-emerald-600" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Operational Costs Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {costsData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No cost data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={costsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, "Costs"]} />
                  <Bar dataKey="value" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Profit Margin Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {marginData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No margin data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={marginData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v}%`, "Margin"]} />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <ManualEntryDialog
        open={showEntry}
        onClose={() => setShowEntry(false)}
        category="efficiency"
        onSave={async (data) => { await createMutation.mutateAsync(data); setShowEntry(false); }}
      />
    </div>
  );
}