import React from "react";
import { DollarSign, TrendingDown, TrendingUp, AlertCircle, Clock } from "lucide-react";

function StatCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <div className={`bg-white rounded-xl border p-4 ${accent || "border-slate-200"}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
        {Icon && <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0"><Icon className="h-4 w-4 text-slate-500" /></div>}
      </div>
    </div>
  );
}

const fmt = (n) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ExpenseSummaryCards({ expenses }) {
  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const fixed = expenses.filter(e => e.expense_type === "Fixed").reduce((s, e) => s + (e.amount || 0), 0);
  const variable = expenses.filter(e => e.expense_type === "Variable").reduce((s, e) => s + (e.amount || 0), 0);
  const largest = expenses.length ? Math.max(...expenses.map(e => e.amount || 0)) : 0;
  const largestExpense = expenses.find(e => (e.amount || 0) === largest);
  const pending = expenses.filter(e => e.payment_status === "Pending").reduce((s, e) => s + (e.amount || 0), 0);
  const pendingCount = expenses.filter(e => e.payment_status === "Pending").length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard label="Total This Month" value={fmt(total)} sub={`${expenses.length} expenses`} icon={DollarSign} />
      <StatCard label="Fixed Expenses" value={fmt(fixed)} sub={`${expenses.filter(e => e.expense_type === "Fixed").length} items`} icon={TrendingDown} />
      <StatCard label="Variable Expenses" value={fmt(variable)} sub={`${expenses.filter(e => e.expense_type === "Variable").length} items`} icon={TrendingUp} />
      <StatCard label="Largest Expense" value={fmt(largest)} sub={largestExpense?.expense_name || "—"} icon={AlertCircle} />
      <StatCard
        label="Pending Payments"
        value={fmt(pending)}
        sub={`${pendingCount} unpaid`}
        icon={Clock}
        accent={pending > 0 ? "border-amber-200 bg-amber-50" : "border-slate-200"}
      />
    </div>
  );
}