import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, ShoppingCart, TrendingUp, Package, BarChart2, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import KPICard from "./KPICard";
import ManualEntryDialog from "./ManualEntryDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

const PERIODS = ["Day", "Week", "Month", "Year"];

function getMetricValues(entries, metric) {
  return entries
    .filter((e) => e.metric === metric)
    .sort((a, b) => a.period.localeCompare(b.period))
    .map((e) => ({ date: e.period, value: e.value }));
}

function getLatest(entries, metric) {
  const filtered = entries.filter((e) => e.metric === metric).sort((a, b) => b.period.localeCompare(a.period));
  return filtered[0]?.value ?? null;
}

function calcTrend(entries, metric) {
  const sorted = entries.filter((e) => e.metric === metric).sort((a, b) => b.period.localeCompare(a.period));
  if (sorted.length < 2) return undefined;
  const [curr, prev] = [sorted[0].value, sorted[1].value];
  if (!prev) return undefined;
  return Math.round(((curr - prev) / prev) * 100);
}

export default function SalesKPI({ entries = [] }) {
  const [period, setPeriod] = useState("Month");
  const [showEntry, setShowEntry] = useState(false);
  const queryClient = useQueryClient();

  // Fetch paid invoices (official revenue source) and order items
  const { data: systemOrders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => base44.entities.Order.list("-order_date"),
    initialData: [],
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list("-invoice_date"),
    initialData: [],
  });

  const { data: orderItems = [] } = useQuery({
    queryKey: ["order_items"],
    queryFn: () => base44.entities.OrderItem.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.KPIEntry.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kpi_entries"] }),
  });

  const salesEntries = entries.filter((e) => e.category === "sales");
  const revenueData = getMetricValues(salesEntries, "Total Revenue");
  const ordersData = getMetricValues(salesEntries, "Total Orders");

  // Only count PAID invoices — official revenue source
  const paidInvoices = invoices.filter((inv) => inv.payment_status === "Paid");
  const paidInvoiceOrderIds = new Set(paidInvoices.map((inv) => inv.order_id).filter(Boolean));

  // Also count paid orders that don't have an associated invoice
  const paidOrders = systemOrders.filter((o) => o.payment_status === "Paid");
  const paidOrderIds = new Set(paidOrders.map((o) => o.id));
  const paidOrdersWithoutInvoice = paidOrders.filter((o) => !paidInvoiceOrderIds.has(o.id));

  const invoiceRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const orderRevenue = paidOrdersWithoutInvoice.reduce((sum, o) => sum + (o.total || 0), 0);
  const revenue = invoiceRevenue + orderRevenue;

  const orders = paidOrders.length;
  const aov = orders > 0 ? Math.round(revenue / orders) : 0;

  // Units from paid orders
  const units = orderItems
    .filter((oi) => paidOrderIds.has(oi.order_id))
    .reduce((sum, oi) => sum + (oi.quantity || 0), 0);
  const growth = getLatest(salesEntries, "Revenue Growth");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Sales Performance</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p}
                data-viewer-allow
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-all",
                  period === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowEntry(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Data
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KPICard label="Total Revenue" value={revenue ?? "—"} prefix={revenue !== null ? "$" : ""} icon={DollarSign} trend={calcTrend(salesEntries, "Total Revenue")} bgLight="bg-emerald-50" iconColor="text-emerald-600" trendLabel="vs previous period" />
        <KPICard label="Total Orders" value={orders ?? "—"} icon={ShoppingCart} trend={calcTrend(salesEntries, "Total Orders")} bgLight="bg-blue-50" iconColor="text-blue-600" />
        <KPICard label="Avg Order Value" value={aov ?? "—"} prefix={aov !== null ? "$" : ""} icon={BarChart2} bgLight="bg-violet-50" iconColor="text-violet-600" />
        <KPICard label="Units Sold" value={units ?? "—"} icon={Package} trend={calcTrend(salesEntries, "Units Sold")} bgLight="bg-cyan-50" iconColor="text-cyan-600" />
        <KPICard label="Revenue Growth" value={growth ?? "—"} unit={growth !== null ? "%" : ""} icon={TrendingUp} bgLight="bg-amber-50" iconColor="text-amber-600" />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No revenue data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, "Revenue"]} />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Orders Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No orders data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={ordersData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [v, "Orders"]} />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <ManualEntryDialog
        open={showEntry}
        onClose={() => setShowEntry(false)}
        category="sales"
        onSave={async (data) => { await createMutation.mutateAsync(data); setShowEntry(false); }}
      />
    </div>
  );
}