import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Paperclip, Send, Loader2, X, User, Clock, Building2, Pencil } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = {
  "Open": "bg-blue-100 text-blue-700",
  "In Progress": "bg-amber-100 text-amber-700",
  "Pending": "bg-purple-100 text-purple-700",
  "Resolved": "bg-green-100 text-green-700",
  "Closed": "bg-slate-100 text-slate-600",
};

const PRIORITY_COLORS = {
  "Low": "bg-slate-100 text-slate-600",
  "Medium": "bg-blue-100 text-blue-700",
  "High": "bg-orange-100 text-orange-700",
  "Urgent": "bg-red-100 text-red-700",
};

const STATUSES = ["Open", "In Progress", "Pending", "Resolved", "Closed"];

export default function TicketDetailDialog({ open, ticket, onClose, onEdit, onStatusChange }) {
  const qc = useQueryClient();
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  const { data: messages = [] } = useQuery({
    queryKey: ["ticket_messages", ticket?.id],
    queryFn: () => base44.entities.TicketMessage.filter({ ticket_id: ticket.id }, "created_date"),
    enabled: !!ticket?.id,
  });

  const addMessage = useMutation({
    mutationFn: (d) => base44.entities.TicketMessage.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticket_messages", ticket?.id] });
      setMessage("");
      setAttachments([]);
    },
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    setAttachments(prev => [...prev, ...urls]);
    setUploading(false);
  };

  const handleSend = async () => {
    if (!message.trim() && !attachments.length) return;
    setSending(true);
    await addMessage.mutateAsync({
      ticket_id: ticket.id,
      content: message,
      attachment_urls: attachments,
    });
    setSending(false);
  };

  if (!ticket) return null;

  const fmtDate = (d) => {
    try { return format(new Date(d), "MMM d, yyyy 'at' h:mm a"); } catch { return d; }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-slate-400">{ticket.ticket_number}</span>
                <Badge className={`${STATUS_COLORS[ticket.status]} border-0 text-xs`}>{ticket.status}</Badge>
                <Badge className={`${PRIORITY_COLORS[ticket.priority]} border-0 text-xs`}>{ticket.priority}</Badge>
              </div>
              <DialogTitle className="text-base font-semibold text-slate-900 leading-snug">{ticket.title}</DialogTitle>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 flex-shrink-0" onClick={() => onEdit(ticket)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{ticket.department}</span>
            {ticket.assigned_to && <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />Assigned: <span className="font-medium text-slate-700">{ticket.assigned_to}</span></span>}
            {ticket.requester_name && <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />Requester: <span className="font-medium text-slate-700">{ticket.requester_name}</span></span>}
            {ticket.created_date && <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{fmtDate(ticket.created_date)}</span>}
          </div>

          {/* Status change */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-400">Change status:</span>
            <Select value={ticket.status} onValueChange={v => onStatusChange(ticket, v)}>
              <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
          {/* Original description */}
          {ticket.description && (
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap border border-slate-200">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Original Request</p>
              {ticket.description}
              {(ticket.attachment_urls || []).length > 0 && (
                <div className="mt-3 space-y-1">
                  {ticket.attachment_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-indigo-600 hover:underline">
                      <Paperclip className="h-3 w-3" />{url.split("/").pop()}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-700">{msg.author_name || "Team"}</span>
                  {msg.created_date && <span className="text-[10px] text-slate-400">{fmtDate(msg.created_date)}</span>}
                </div>
                <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap">
                  {msg.content}
                  {(msg.attachment_urls || []).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.attachment_urls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:underline">
                          <Paperclip className="h-3 w-3" />{url.split("/").pop()}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {messages.length === 0 && !ticket.description && (
            <p className="text-center text-slate-400 text-sm py-8">No messages yet. Add the first update below.</p>
          )}
        </div>

        {/* Reply box */}
        <div className="px-6 pb-5 pt-3 border-t border-slate-200 space-y-2">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {attachments.map((url, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs bg-slate-100 rounded px-2 py-1">
                  <Paperclip className="h-3 w-3 text-slate-400" />
                  <span className="max-w-[150px] truncate text-slate-600">{url.split("/").pop()}</span>
                  <button onClick={() => setAttachments(a => a.filter((_, j) => j !== i))}><X className="h-3 w-3 text-slate-400 hover:text-red-400" /></button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              rows={2}
              placeholder="Write an update, resolution or comment..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="flex-1 resize-none text-sm"
              onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSend(); }}
            />
            <div className="flex flex-col gap-1.5">
              <label className="cursor-pointer p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
              <Button size="icon" onClick={handleSend} disabled={sending || (!message.trim() && !attachments.length)} className="bg-indigo-600 hover:bg-indigo-700">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-slate-400">Ctrl+Enter to send</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}