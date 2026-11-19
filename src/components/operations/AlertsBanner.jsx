import React, { useState } from "react";
import { AlertTriangle, Clock, Flag, X } from "lucide-react";
import { isPast, isWithinInterval, addDays, format } from "date-fns";

export default function AlertsBanner({ tasks }) {
  const [dismissed, setDismissed] = useState([]);
  const today = new Date();

  const alerts = [];

  tasks.forEach(t => {
    if (dismissed.includes(t.id + "_overdue") || t.status === "Completed") return;
    const due = t.due_date ? new Date(t.due_date) : null;

    if (due && isPast(due)) {
      alerts.push({
        id: t.id + "_overdue",
        type: "overdue",
        icon: AlertTriangle,
        color: "bg-red-50 border-red-200 text-red-800",
        iconColor: "text-red-500",
        message: `"${t.task_name}" is overdue (was due ${format(due, "MMM d")})`,
      });
    } else if (due && isWithinInterval(due, { start: today, end: addDays(today, 3) })) {
      if (!dismissed.includes(t.id + "_soon")) {
        alerts.push({
          id: t.id + "_soon",
          type: "soon",
          icon: Clock,
          color: "bg-amber-50 border-amber-200 text-amber-800",
          iconColor: "text-amber-500",
          message: `"${t.task_name}" is due ${format(due, "MMM d")}`,
        });
      }
    } else if (t.priority === "High" && t.status === "To Do") {
      if (!dismissed.includes(t.id + "_high")) {
        alerts.push({
          id: t.id + "_high",
          type: "high",
          icon: Flag,
          color: "bg-orange-50 border-orange-200 text-orange-800",
          iconColor: "text-orange-500",
          message: `High priority task pending: "${t.task_name}"`,
        });
      }
    }
  });

  const visible = alerts.filter(a => !dismissed.includes(a.id)).slice(0, 4);
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map(alert => (
        <div key={alert.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${alert.color} text-sm`}>
          <alert.icon className={`h-4 w-4 flex-shrink-0 ${alert.iconColor}`} />
          <span className="flex-1">{alert.message}</span>
          <button onClick={() => setDismissed(d => [...d, alert.id])} className="flex-shrink-0 hover:opacity-60">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}