import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DollarSign, TrendingUp, Star, Package, Plus, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import SalesKPI from "@/components/kpi/SalesKPI";
import EfficiencyKPI from "@/components/kpi/EfficiencyKPI";
import CustomerKPI from "@/components/kpi/CustomerKPI";
import InventoryKPI from "@/components/kpi/InventoryKPI";
import KPIAlertBanner from "@/components/kpi/KPIAlertBanner";
import ManualEntryDialog from "@/components/kpi/ManualEntryDialog";

const TABS = [
  { key: "sales", label: "Sales", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50", activeBg: "bg-emerald-500" },
  { key: "efficiency", label: "Efficiency", icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50", activeBg: "bg-violet-500" },
  { key: "customer", label: "Customer", icon: Star, color: "text-amber-600", bg: "bg-amber-50", activeBg: "bg-amber-500" },
  { key: "inventory", label: "Inventory", icon: Package, color: "text-cyan-600", bg: "bg-cyan-50", activeBg: "bg-cyan-500" },
];

function getLatest(entries, category, metric) {
  const filtered = entries.filter((e) => e.category === category && e.metric === metric)
    .sort((a, b) => b.period.localeCompare(a.period));
  return filtered[0]?.value ?? null;
}

export default function KPIDashboard() {
  const isAdmin = useIsAdmin();
  const [activeTab, setActiveTab] = useState("sales");
  const [showEntry, setShowEntry] = useState(false);
  const queryClient = useQueryClient();

  const { data: entries = [] } = useQuery({
    queryKey: ["kpi_entries"],
    queryFn: () => base44.entities.KPIEntry.list("-period"),
    initialData: [],
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["kpi_alerts"],
    queryFn: () => base44.entities.KPIAlert.filter({ is_resolved: false }),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.KPIEntry.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kpi_entries"] }),
  });

  // Auto-generate alerts based on data
  const autoAlerts = [];
  const revenue = getLatest(entries, "sales", "Total Revenue");
  const complaints = getLatest(entries, "customer", "Number of Complaints");
  const outOfStock = getLatest(entries, "inventory", "Out of Stock Products");
  const lowStock = getLatest(entries, "inventory", "Low Stock Products");

  if (outOfStock > 0) autoAlerts.push({ id: "auto_oos", severity: "critical", title: "Out of Stock Alert", message: `${outOfStock} product(s) are out of stock and need restocking.` });
  if (lowStock > 5) autoAlerts.push({ id: "auto_low", severity: "high", title: "Low Stock Warning", message: `${lowStock} products are running low on inventory.` });
  if (complaints > 10) autoAlerts.push({ id: "auto_complaints", severity: "high", title: "High Complaint Rate", message: `${complaints} complaints recorded. Review customer feedback.` });

  const allAlerts = [...autoAlerts, ...alerts];

  // Summary KPI cards at top
  const summaryMetrics = [
    { label: "Total Revenue", value: revenue, prefix: "$", tab: "sales", color: "border-l-emerald-500" },
    { label: "Profit Margin", value: getLatest(entries, "efficiency", "Profit Margin (%)"), unit: "%", tab: "efficiency", color: "border-l-violet-500" },
    { label: "Customer Rating", value: getLatest(entries, "customer", "Customer Rating (1-5)"), unit: "/5", tab: "customer", color: "border-l-amber-500" },
    { label: "Inventory Value", value: getLatest(entries, "inventory", "Total Inventory Value"), prefix: "$", tab: "inventory", color: "border-l-cyan-500" },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">KPI Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">Monitor the operational and financial health of the brand</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowEntry(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <Plus className="h-4 w-4" /> Add KPI Entry
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryMetrics.map((m) => (
          <button key={m.label} data-viewer-allow onClick={() => setActiveTab(m.tab)} className="text-left">
            <Card className={cn("border-slate-200 border-l-4 hover:shadow-sm transition-shadow cursor-pointer", m.color)}>
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 font-medium">{m.label}</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {m.value !== null && m.value !== undefined
                    ? `${m.prefix || ""}${typeof m.value === "number" ? m.value.toLocaleString() : m.value}${m.unit || ""}`
                    : <span className="text-slate-300 font-normal text-sm">No data</span>
                  }
                </p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {/* Alerts */}
      {allAlerts.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Active Alerts ({allAlerts.length})
          </p>
          <KPIAlertBanner alerts={allAlerts.filter((a) => a.id)} />
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              data-viewer-allow
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                isActive
                  ? `${tab.activeBg} text-white border-transparent shadow-sm`
                  : `bg-white ${tab.color} border-slate-200 hover:border-slate-300`
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active KPI Section */}
      <Card className="border-slate-200">
        <CardContent className="p-6">
          {activeTab === "sales" && <SalesKPI entries={entries} />}
          {activeTab === "efficiency" && <EfficiencyKPI entries={entries} />}
          {activeTab === "customer" && <CustomerKPI entries={entries} />}
          {activeTab === "inventory" && <InventoryKPI entries={entries} />}
        </CardContent>
      </Card>

      <ManualEntryDialog
        open={showEntry}
        onClose={() => setShowEntry(false)}
        onSave={async (data) => { await createMutation.mutateAsync(data); setShowEntry(false); }}
      />
    </div>
  );
}