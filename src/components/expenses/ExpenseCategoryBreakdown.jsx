import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#92400e", "#b45309", "#d97706", "#f59e0b", "#fbbf24", "#a78bfa", "#60a5fa", "#34d399", "#f87171", "#94a3b8", "#6366f1"];

const fmt = (n) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ExpenseCategoryBreakdown({ expenses }) {
  const byCategory = expenses.reduce((acc, e) => {
    const cat = e.category || "Miscellaneous";
    acc[cat] = (acc[cat] || 0) + (e.amount || 0);
    return acc;
  }, {});

  const data = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Breakdown by Category</h3>
      {!data.length ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No expenses to display</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-2">
            {data.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-600 truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  <span className="text-slate-400">{total > 0 ? Math.round((item.value / total) * 100) : 0}%</span>
                  <span className="font-semibold text-slate-800">{fmt(item.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}