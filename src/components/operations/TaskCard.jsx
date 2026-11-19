import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, User, Paperclip, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { format, isPast, isWithinInterval, addDays } from "date-fns";

const PRIORITY_STYLES = {
  Low: "bg-green-100 text-green-700 border-green-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  High: "bg-red-100 text-red-700 border-red-200",
};

const MODULE_COLORS = {
  Marketing: "bg-pink-50 text-pink-700",
  Product: "bg-blue-50 text-blue-700",
  Sales: "bg-green-50 text-green-700",
  Inventory: "bg-orange-50 text-orange-700",
  Strategy: "bg-purple-50 text-purple-700",
  Operations: "bg-slate-100 text-slate-700",
  Brand: "bg-indigo-50 text-indigo-700",
  Other: "bg-slate-50 text-slate-600",
};

export default function TaskCard({ task, onEdit, onDelete, provided }) {
  const today = new Date();
  const due = task.due_date ? new Date(task.due_date) : null;
  const isOverdue = due && isPast(due) && task.status !== "Completed";
  const isDueSoon = due && !isOverdue && isWithinInterval(due, { start: today, end: addDays(today, 3) });

  return (
    <div
      ref={provided?.innerRef}
      {...(provided?.draggableProps || {})}
      {...(provided?.dragHandleProps || {})}
      className={`bg-white rounded-xl border ${isOverdue ? "border-red-200 bg-red-50/30" : "border-slate-200"} p-3 shadow-sm hover:shadow-md transition-all duration-150 group cursor-pointer`}
      onClick={() => onEdit(task)}
    >
      {/* Priority + Module */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap gap-1">
          <Badge className={`text-[10px] px-1.5 py-0 border ${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.Medium}`}>
            {task.priority}
          </Badge>
          {task.related_module && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${MODULE_COLORS[task.related_module] || MODULE_COLORS.Other}`}>
              {task.related_module}
            </span>
          )}
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={e => e.stopPropagation()}>
          <Button size="icon" variant="ghost" onClick={() => onEdit(task)} className="h-6 w-6"><Pencil className="h-3 w-3 text-slate-500" /></Button>
          <Button size="icon" variant="ghost" onClick={() => onDelete(task)} className="h-6 w-6"><Trash2 className="h-3 w-3 text-red-400" /></Button>
        </div>
      </div>

      {/* Title */}
      <p className={`text-sm font-medium leading-snug ${isOverdue ? "text-red-800" : "text-slate-800"}`}>{task.task_name}</p>

      {task.description && (
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2.5">
          {task.assigned_to && (
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[80px]">{task.assigned_to}</span>
            </div>
          )}
          {(task.file_urls?.length > 0) && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Paperclip className="h-3 w-3" />
              <span>{task.file_urls.length}</span>
            </div>
          )}
        </div>
        {due && (
          <div className={`flex items-center gap-1 text-[11px] ${isOverdue ? "text-red-600 font-medium" : isDueSoon ? "text-amber-600" : "text-slate-400"}`}>
            {isOverdue ? <AlertTriangle className="h-3 w-3" /> : <CalendarDays className="h-3 w-3" />}
            <span>{format(due, "MMM d")}</span>
          </div>
        )}
      </div>

      {task.project_name && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <span className="text-[10px] text-slate-400">📁 {task.project_name}</span>
        </div>
      )}
    </div>
  );
}