import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CheckCircle2, Clock, UserX, ListTodo, ArrowRight } from "lucide-react";
import { format, isThisWeek } from "date-fns";

const STATUS_COLORS = {
  "To Do": "bg-slate-100 text-slate-600",
  "In Progress": "bg-blue-100 text-blue-700",
  "Review": "bg-amber-100 text-amber-700",
  "Completed": "bg-emerald-100 text-emerald-700",
};

const PRIORITY_COLORS = {
  High: "text-red-600",
  Medium: "text-amber-600",
  Low: "text-slate-400",
};

export default function OperationsSnapshot({ tasks = [] }) {
  const open = tasks.filter(t => t.status !== "Completed").length;
  const dueThisWeek = tasks.filter(t => t.due_date && isThisWeek(new Date(t.due_date)) && t.status !== "Completed").length;
  const waitingClient = tasks.filter(t => t.assigned_to?.toLowerCase().includes("client")).length;
  const completed = tasks.filter(t => t.status === "Completed").length;

  const recentTasks = tasks.filter(t => t.status !== "Completed").slice(0, 5);

  return (
    <Card className="border-slate-200 shadow-sm h-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Operations Snapshot</CardTitle>
        <Link to={createPageUrl("Operations")} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: ListTodo, label: "Open Tasks", value: open, color: "text-slate-700" },
            { icon: Clock, label: "Due This Week", value: dueThisWeek, color: "text-amber-600" },
            { icon: UserX, label: "Waiting on Client", value: waitingClient, color: "text-rose-600" },
            { icon: CheckCircle2, label: "Completed", value: completed, color: "text-emerald-600" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2.5">
              <Icon className={`h-4 w-4 ${color} flex-shrink-0`} />
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className={`text-base font-bold ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Task Table */}
        {recentTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100">
                  <th className="text-left pb-2 font-medium">Task</th>
                  <th className="text-left pb-2 font-medium">Owner</th>
                  <th className="text-left pb-2 font-medium">Status</th>
                  <th className="text-left pb-2 font-medium">Due</th>
                </tr>
              </thead>
              <tbody className="space-y-1">
                {recentTasks.map(task => (
                  <tr key={task.id} className="border-b border-slate-50">
                    <td className="py-2 pr-2">
                      <span className={`font-medium text-slate-800 ${PRIORITY_COLORS[task.priority] ? "border-l-2 pl-1.5" : ""}`}
                        style={{ borderColor: task.priority === "High" ? "#ef4444" : task.priority === "Medium" ? "#f59e0b" : "#cbd5e1" }}>
                        {task.task_name}
                      </span>
                    </td>
                    <td className="py-2 pr-2 text-slate-500">{task.assigned_to || "—"}</td>
                    <td className="py-2 pr-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[task.status] || "bg-slate-100 text-slate-600"}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="py-2 text-slate-500">
                      {task.due_date ? format(new Date(task.due_date), "MMM d") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">No open tasks</p>
        )}
      </CardContent>
    </Card>
  );
}