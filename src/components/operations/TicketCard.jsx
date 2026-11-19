import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Clock, Building2, Paperclip, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_COLORS = {
  "Open": "bg-blue-100 text-blue-700",
  "In Progress": "bg-amber-100 text-amber-700",
  "Pending": "bg-purple-100 text-purple-700",
  "Resolved": "bg-green-100 text-green-700",
  "Closed": "bg-slate-100 text-slate-500",
};

const PRIORITY_COLORS = {
  "Low": "bg-slate-100 text-slate-600",
  "Medium": "bg-blue-100 text-blue-700",
  "High": "bg-orange-100 text-orange-700",
  "Urgent": "bg-red-100 text-red-700",
};

const PRIORITY_BORDER = {
  "Low": "border-l-slate-300",
  "Medium": "border-l-blue-400",
  "High": "border-l-orange-400",
  "Urgent": "border-l-red-500",
};

export default function TicketCard({ ticket, messageCount = 0, onClick }) {
  const timeAgo = ticket.created_date
    ? formatDistanceToNow(new Date(ticket.created_date), { addSuffix: true })
    : null;

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 border-l-4 ${PRIORITY_BORDER[ticket.priority] || "border-l-slate-300"} rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-150 space-y-3`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-mono text-slate-400">{ticket.ticket_number}</span>
            <Badge className={`${STATUS_COLORS[ticket.status]} border-0 text-[10px] px-1.5 py-0`}>{ticket.status}</Badge>
          </div>
          <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">{ticket.title}</p>
        </div>
        <Badge className={`${PRIORITY_COLORS[ticket.priority]} border-0 text-[10px] flex-shrink-0`}>{ticket.priority}</Badge>
      </div>

      {/* Description preview */}
      {ticket.description && (
        <p className="text-xs text-slate-500 line-clamp-2">{ticket.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{ticket.department}</span>
          {ticket.assigned_to && <span className="flex items-center gap-1"><User className="h-3 w-3" />{ticket.assigned_to}</span>}
        </div>
        <div className="flex items-center gap-2">
          {(ticket.attachment_urls || []).length > 0 && (
            <span className="flex items-center gap-0.5"><Paperclip className="h-3 w-3" />{ticket.attachment_urls.length}</span>
          )}
          {messageCount > 0 && (
            <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3" />{messageCount}</span>
          )}
          {timeAgo && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo}</span>}
        </div>
      </div>
    </div>
  );
}