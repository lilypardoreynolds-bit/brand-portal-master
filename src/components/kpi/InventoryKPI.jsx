import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, RefreshCw, AlertTriangle, XCircle, Plus, DollarSign, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import KPICard from "./KPICard";
import ManualEntryDialog from "./ManualEntryDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

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

export default function InventoryKPI({ entries = [] }) {
  const [showEntry, setShowEntry] = useState(false);
  const queryClient = useQueryClient();

  // Fetch real-time inventory data
  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => base44.entities.Inventory.list("product_name"),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.KPIEntry.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kpi_entries"] }),
  });

  const invEntries = entries.filter((e) => e.category === "inventory");
  const totalValue = getLatest(invEntries, "Total Inventory Value");
  const turnover = getLatest(invEntries, "Stock Turnover Rate");
  const lowStock = getLatest(invEntries, "Low Stock Products");
  const outOfStock = getLatest(invEntries, "Out of Stock Products");

  // Real-time inventory calculations
  const realtimeTotalProducts = inventory.length;
  const realtimeTotalOnHand = inventory.reduce((sum, i) => sum + (i.on_hand ?? i.current_stock ?? 0), 0);
  const realtimeTotalValue = inventory.reduce((sum, i) => sum + ((i.on_hand ?? i.current_stock ?? 0) * (i.unit_cost || 0)), 0);
  const realtimeLowStock = inventory.filter(i => i.min_stock_level > 0 && (i.available ?? (i.on_hand ?? i.current_stock ?? 0) - (i.reserved ?? 0)) <= i.min_stock_level && (i.available ?? (i.on_hand ?? i.current_stock ?? 0) - (i.reserved ?? 0)) > 0).length;
  const realtimePendingOrders = inventory.reduce((sum, i) => sum + (i.reserved ?? 0), 0);
  const realtimeOutOfStock = inventory.filter(i => (i.available ?? (i.on_hand ?? i.current_stock ?? 0) - (i.reserved ?? 0)) === 0).length;

  const valueData = getMetricValues(invEntries, "Total Inventory Value");
  const stockData = [
    { name: "Total Value", value: totalValue ?? 0 },
    { name: "Low Stock", value: lowStock ?? 0 },
    { name: "Out of Stock", value: outOfStock ?? 0 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-cyan-500 flex items-center justify-center">
            <Package className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Inventory</h3>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowEntry(true)}>
          <Plus className="h-3.5 w-3.5" /> Add Data
        </Button>
      </div>

      {/* Stock alerts */}
      {((lowStock !== null && lowStock > 0) || (outOfStock !== null && outOfStock > 0)) && (
        <div className="space-y-2">
          {outOfStock > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-3 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">
                  <span className="font-semibold">{outOfStock} product{outOfStock !== 1 ? "s" : ""}</span> currently out of stock
                </p>
              </CardContent>
            </Card>
          )}
          {lowStock > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">{lowStock} product{lowStock !== 1 ? "s" : ""}</span> running low on stock
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Real-time Inventory Stats */}
      <div className="border-b border-slate-200 pb-5">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Real-Time Stock Levels</h4>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <KPICard label="Total Products" value={realtimeTotalProducts} icon={Package} bgLight="bg-indigo-50" iconColor="text-indigo-600" />
          <KPICard label="On Hand" value={realtimeTotalOnHand} icon={Package} bgLight="bg-purple-50" iconColor="text-purple-600" />
          <KPICard label="Inventory Value" value={`$${realtimeTotalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`} icon={DollarSign} bgLight="bg-green-50" iconColor="text-green-600" />
          <KPICard label="Pending Orders" value={realtimePendingOrders} icon={Clock} bgLight={realtimePendingOrders > 0 ? "bg-blue-50" : "bg-slate-50"} iconColor={realtimePendingOrders > 0 ? "text-blue-600" : "text-slate-400"} />
          <KPICard label="Low Stock" value={realtimeLowStock} icon={AlertTriangle} bgLight="bg-amber-50" iconColor="text-amber-500" />
        </div>
      </div>

      {/* KPI Entry Metrics */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">KPI Metrics</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard label="Inventory Value (KPI)" value={totalValue ?? "—"} prefix={totalValue !== null ? "$" : ""} icon={Package} bgLight="bg-cyan-50" iconColor="text-cyan-600" />
          <KPICard label="Stock Turnover" value={turnover ?? "—"} unit={turnover !== null ? "x" : ""} icon={RefreshCw} bgLight="bg-indigo-50" iconColor="text-indigo-600" />
          <KPICard label="Low Stock (KPI)" value={lowStock ?? "—"} icon={AlertTriangle} bgLight="bg-amber-50" iconColor="text-amber-500" />
          <KPICard label="Out of Stock (KPI)" value={outOfStock ?? "—"} icon={XCircle} bgLight="bg-red-50" iconColor="text-red-500" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Inventory Value Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {valueData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No inventory data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={valueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, "Value"]} />
                  <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Stock Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <ManualEntryDialog
        open={showEntry}
        onClose={() => setShowEntry(false)}
        category="inventory"
        onSave={async (data) => { await createMutation.mutateAsync(data); setShowEntry(false); }}
      />
    </div>
  );
}