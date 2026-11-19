import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, PiggyBank, DollarSign, Plus, Pencil, Trash2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import BudgetAllocationDialog from "./BudgetAllocationDialog";

const MARKETING_RATE = 0.05;
const CASHFLOW_RATE = 0.05;

function fmt(n) { return `$${(n || 0).toFixed(2)}`; }

function SummaryCard({ icon: Icon, label, earned, spent, color }) {
  const balance = earned - spent;
  return (
    <Card className={`border-2 ${color.border}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color.icon}`} />
          <p className={`text-xs font-semibold uppercase tracking-wide ${color.text}`}>{label}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-slate-400 mb-0.5">Acumulado</p>
            <p className={`font-bold ${color.text}`}>{fmt(earned)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 mb-0.5">Alocado</p>
            <p className="font-bold text-red-500">{fmt(spent)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 mb-0.5">Saldo</p>
            <p className={`font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(balance)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BudgetPanel({ orders = [] }) {
  const queryClient = useQueryClient();
  const [filterYear, setFilterYear] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [allocationDialog, setAllocationDialog] = useState({ open: false, allocation: null });
  const [bucketFilter, setBucketFilter] = useState("all");

  const { data: allocations = [] } = useQuery({
    queryKey: ["budget_allocations"],
    queryFn: () => base44.entities.BudgetAllocation.list("-date"),
  });

  const saveMutation = useMutation({
    mutationFn: ({ form, existing }) => existing?.id
      ? base44.entities.BudgetAllocation.update(existing.id, form)
      : base44.entities.BudgetAllocation.create(form),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budget_allocations"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BudgetAllocation.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budget_allocations"] }),
  });

  // Only paid/completed orders
  const paidOrders = orders.filter(o => o.payment_status === "Paid" || o.order_status === "Completed");

  const years = [...new Set(paidOrders.map(o => o.order_date?.substring(0, 4)).filter(Boolean))].sort().reverse();
  const months = [
    { value: "01", label: "Janeiro" }, { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" },   { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },   { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },{ value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },{ value: "12", label: "Dezembro" },
  ];

  const applyDateFilter = (item, dateField) => {
    if (filterYear !== "all" && !item[dateField]?.startsWith(filterYear)) return false;
    if (filterMonth !== "all" && item[dateField]?.substring(5, 7) !== filterMonth) return false;
    return true;
  };

  const filteredOrders = paidOrders.filter(o => applyDateFilter(o, "order_date"));
  const filteredAllocations = allocations.filter(a => applyDateFilter(a, "date"));

  // Totals
  const totalRevenue = filteredOrders.reduce((s, o) => s + (o.total || 0), 0);
  const marketingEarned = totalRevenue * MARKETING_RATE;
  const cashflowEarned = totalRevenue * CASHFLOW_RATE;
  const marketingSpent = filteredAllocations.filter(a => a.bucket === "marketing").reduce((s, a) => s + (a.amount || 0), 0);
  const cashflowSpent = filteredAllocations.filter(a => a.bucket === "cashflow").reduce((s, a) => s + (a.amount || 0), 0);

  const displayedAllocations = filteredAllocations.filter(a => bucketFilter === "all" || a.bucket === bucketFilter);

  return (
    <div className="space-y-6">
      {/* Date filters */}
      <div className="flex gap-2 items-center">
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="Ano" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os anos</SelectItem>
            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Mês" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os meses</SelectItem>
            {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto text-xs text-slate-400">
          Base: <span className="font-semibold text-slate-600">{fmt(totalRevenue)}</span> em vendas pagas
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <SummaryCard
          icon={TrendingUp}
          label="Marketing (5%)"
          earned={marketingEarned}
          spent={marketingSpent}
          color={{ border: "border-indigo-200", icon: "text-indigo-600", text: "text-indigo-700" }}
        />
        <SummaryCard
          icon={PiggyBank}
          label="Cash Flow (5%)"
          earned={cashflowEarned}
          spent={cashflowSpent}
          color={{ border: "border-emerald-200", icon: "text-emerald-600", text: "text-emerald-700" }}
        />
      </div>

      {/* Allocations ledger */}
      <Card className="border border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700">Balancete de Alocações</CardTitle>
          <div className="flex gap-2">
            <Select value={bucketFilter} onValueChange={setBucketFilter}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="cashflow">Cash Flow</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-700" onClick={() => setAllocationDialog({ open: true, allocation: null })}>
              <Plus className="h-3.5 w-3.5" /> Registrar saída
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {displayedAllocations.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">Nenhuma alocação registrada para o período.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    {["Data", "Bucket", "Categoria", "Descrição", "Referência", "Valor", ""].map(h => (
                      <th key={h} className="pb-3 pr-4 font-semibold text-slate-600 text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedAllocations.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-4 text-xs text-slate-500 whitespace-nowrap">{a.date}</td>
                      <td className="py-3 pr-4">
                        {a.bucket === "marketing"
                          ? <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs">📣 Marketing</Badge>
                          : <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">🐷 Cash Flow</Badge>}
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-500">{a.category || "—"}</td>
                      <td className="py-3 pr-4 text-slate-700">{a.description}</td>
                      <td className="py-3 pr-4 text-xs text-slate-400">{a.reference || "—"}</td>
                      <td className="py-3 pr-4 font-semibold text-red-600">{fmt(a.amount)}</td>
                      <td className="py-3">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAllocationDialog({ open: true, allocation: a })}>
                            <Pencil className="h-3 w-3 text-slate-400" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(a.id)}>
                            <Trash2 className="h-3 w-3 text-red-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-300">
                  <tr className="bg-slate-50">
                    <td colSpan={5} className="py-3 pr-4 font-bold text-slate-700 text-xs uppercase">TOTAL ALOCADO</td>
                    <td className="py-3 pr-4 font-bold text-red-600">
                      {fmt(displayedAllocations.reduce((s, a) => s + (a.amount || 0), 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <BudgetAllocationDialog
        open={allocationDialog.open}
        allocation={allocationDialog.allocation}
        onClose={() => setAllocationDialog({ open: false, allocation: null })}
        onSave={(form) => saveMutation.mutateAsync({ form, existing: allocationDialog.allocation })}
      />
    </div>
  );
}