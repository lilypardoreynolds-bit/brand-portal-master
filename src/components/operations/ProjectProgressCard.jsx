import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CalendarDays } from "lucide-react";
import { format, differenceInDays } from "date-fns";

const STATUS_STYLES = {
  Planning: "bg-slate-100 text-slate-700",
  Active: "bg-blue-100 text-blue-700",
  "On Hold": "bg-amber-100 text-amber-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

export default function ProjectProgressCard({ project, tasks, onEdit, onDelete }) {
  const projectTasks = tasks.filter(t => t.project_id === project.id);
  const completed = projectTasks.filter(t => t.status === "Completed").length;
  const total = projectTasks.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const daysLeft = project.end_date
    ? differenceInDays(new Date(project.end_date), new Date())
    : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: project.color || "#6366f1" }} />
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">{project.project_name}</h3>
            {project.description && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{project.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <Button size="icon" variant="ghost" onClick={() => onEdit(project)} className="h-6 w-6"><Pencil className="h-3 w-3 text-slate-500" /></Button>
          <Button size="icon" variant="ghost" onClick={() => onDelete(project)} className="h-6 w-6"><Trash2 className="h-3 w-3 text-red-400" /></Button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-500">{completed}/{total} tasks</span>
        <span className="text-xs font-semibold text-slate-700">{progress}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: project.color || "#6366f1" }}
        />
      </div>

      <div className="flex items-center justify-between mt-3">
        <Badge className={`text-[11px] px-2 py-0.5 ${STATUS_STYLES[project.status] || STATUS_STYLES.Planning}`}>
          {project.status}
        </Badge>
        {daysLeft !== null && (
          <div className={`flex items-center gap-1 text-[11px] ${daysLeft < 0 ? "text-red-500" : daysLeft <= 7 ? "text-amber-500" : "text-slate-400"}`}>
            <CalendarDays className="h-3 w-3" />
            {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "Due today" : `${daysLeft}d left`}
          </div>
        )}
      </div>
    </div>
  );
}