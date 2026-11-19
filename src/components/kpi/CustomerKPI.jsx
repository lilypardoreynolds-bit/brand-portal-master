import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MessageSquareWarning, Users, Repeat, Plus } from "lucide-react";
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

function StarRating({ value }) {
  if (value === null) return <span className="text-slate-400 text-sm">—</span>;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-5 w-5 ${s <= Math.round(value) ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
        />
      ))}
      <span className="text-sm font-semibold text-slate-700 ml-1">{value?.toFixed(1)}</span>
    </div>
  );
}

export default function CustomerKPI({ entries = [] }) {
  const [showEntry, setShowEntry] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.KPIEntry.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kpi_entries"] }),
  });

  const custEntries = entries.filter((e) => e.category === "customer");
  const rating = getLatest(custEntries, "Customer Rating (1-5)");
  const complaints = getLatest(custEntries, "Number of Complaints");
  const retention = getLatest(custEntries, "Customer Retention Rate (%)");
  const repeatRate = getLatest(custEntries, "Repeat Purchase Rate (%)");

  const ratingData = getMetricValues(custEntries, "Customer Rating (1-5)");
  const complaintData = getMetricValues(custEntries, "Number of Complaints");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Star className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Customer Satisfaction</h3>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowEntry(true)}>
          <Plus className="h-3.5 w-3.5" /> Add Data
        </Button>
      </div>

      {/* Rating highlight */}
      {rating !== null && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Current Customer Rating</p>
              <StarRating value={rating} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Customer Rating" value={rating !== null ? rating.toFixed(1) : "—"} unit={rating !== null ? "/5" : ""} icon={Star} bgLight="bg-amber-50" iconColor="text-amber-500" trend={calcTrend(custEntries, "Customer Rating (1-5)")} />
        <KPICard label="Complaints" value={complaints ?? "—"} icon={MessageSquareWarning} trend={calcTrend(custEntries, "Number of Complaints")} bgLight="bg-red-50" iconColor="text-red-500" trendLabel="Lower is better" />
        <KPICard label="Retention Rate" value={retention ?? "—"} unit={retention !== null ? "%" : ""} icon={Users} trend={calcTrend(custEntries, "Customer Retention Rate (%)")} bgLight="bg-emerald-50" iconColor="text-emerald-600" />
        <KPICard label="Repeat Purchase" value={repeatRate ?? "—"} unit={repeatRate !== null ? "%" : ""} icon={Repeat} trend={calcTrend(custEntries, "Repeat Purchase Rate (%)")} bgLight="bg-indigo-50" iconColor="text-indigo-600" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Satisfaction Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {ratingData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No rating data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={ratingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v}/5`, "Rating"]} />
                  <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Complaints Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {complaintData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No complaint data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={complaintData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [v, "Complaints"]} />
                  <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <ManualEntryDialog
        open={showEntry}
        onClose={() => setShowEntry(false)}
        category="customer"
        onSave={async (data) => { await createMutation.mutateAsync(data); setShowEntry(false); }}
      />
    </div>
  );
}