import React from "react";
import { CheckCircle2, Clock, AlertTriangle, Zap } from "lucide-react";
import { isPast, isWithinInterval, addDays, startOfWeek, endOfWeek } from "date-fns";

export default function OpsStatsBar({ tasks }) {
  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);

  const active = tasks.filter(t => t.status !== "Completed" && t.status !== "Cancelled").length;
  const overdue = tasks.filter(t => {
    const due = t.due_date ? new Date(t.due_date) : null;
    return due && isPast(due) && t.status !== "Completed";
  }).length;
  const dueSoon = tasks.filter(t => {
    const due = t.due_date ? new Date(t.due_date) : null;
    return due && !isPast(due) && isWithinInterval(due, { start: today, end: addDays(today, 3) });
  }).length;
  const completedThisWeek = tasks.filter(t => {
    if (t.status !== "Completed") return false;
    const updated = t.updated_date ? new Date(t.updated_date) : null;
    return updated && isWithinInterval(updated, { start: weekStart, end: weekEnd });
  }).length;

  const stats = [
    { label: "Active Tasks", value: active, icon: Zap, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Overdue", value: overdue, icon: AlertTriangle, color: overdue > 0 ? "text-red-600" : "text-slate-400", bg: overdue > 0 ? "bg-red-50" : "bg-slate-50" },
    { label: "Due in 3 Days", value: dueSoon, icon: Clock, color: dueSoon > 0 ? "text-amber-600" : "text-slate-400", bg: dueSoon > 0 ? "bg-amber-50" : "bg-slate-50" },
    { label: "Done This Week", value: completedThisWeek, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(s => (
        <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className={`${s.bg} p-2.5 rounded-lg flex-shrink-0`}>
            <s.icon className={`h-4 w-4 ${s.color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-500 leading-tight">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}