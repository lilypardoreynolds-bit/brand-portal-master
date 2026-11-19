import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, X, Ticket, Filter } from "lucide-react";
import TicketCard from "@/components/operations/TicketCard";
import TicketFormDialog from "@/components/operations/TicketFormDialog";
import TicketDetailDialog from "@/components/operations/TicketDetailDialog";

const DEPARTMENTS = ["All", "Marketing", "Sales", "Operations", "Inventory", "Finance", "Product", "Brand", "Other"];
const STATUSES = ["All", "Open", "In Progress", "Pending", "Resolved", "Closed"];
const PRIORITIES = ["All", "Low", "Medium", "High", "Urgent"];

const STATUS_TAB_COLORS = {
  "All": "bg-slate-100 text-slate-700",
  "Open": "bg-blue-100 text-blue-700",
  "In Progress": "bg-amber-100 text-amber-700",
  "Pending": "bg-purple-100 text-purple-700",
  "Resolved": "bg-green-100 text-green-700",
  "Closed": "bg-slate-100 text-slate-500",
};

export default function Operations() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDept, setFilterDept] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [formDialog, setFormDialog] = useState({ open: false, ticket: null });
  const [detailDialog, setDetailDialog] = useState({ open: false, ticket: null });

  const { data: tickets = [] } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => base44.entities.Ticket.list("-created_date"),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["ticket_messages_all"],
    queryFn: () => base44.entities.TicketMessage.list(),
  });

  const saveMutation = useMutation({
    mutationFn: async (form) => {
      if (form.id) {
        const { id, ...rest } = form;
        return base44.entities.Ticket.update(id, rest);
      }
      // auto ticket number
      const count = tickets.length + 1;
      const ticket_number = `#${String(count).padStart(4, "0")}`;
      return base44.entities.Ticket.create({ ...form, ticket_number });
    },
    onSuccess: (saved, form) => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      // if editing open ticket, refresh detail
      if (form.id && detailDialog.ticket?.id === form.id) {
        setDetailDialog(d => ({ ...d, ticket: { ...d.ticket, ...form } }));
      }
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ ticket, status }) => base44.entities.Ticket.update(ticket.id, { status }),
    onSuccess: (_, { ticket, status }) => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      if (detailDialog.ticket?.id === ticket.id) {
        setDetailDialog(d => ({ ...d, ticket: { ...d.ticket, status } }));
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Ticket.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets"] }),
  });

  const messageCountMap = useMemo(() => {
    const map = {};
    messages.forEach(m => { map[m.ticket_id] = (map[m.ticket_id] || 0) + 1; });
    return map;
  }, [messages]);

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      if (filterStatus !== "All" && t.status !== filterStatus) return false;
      if (filterDept !== "All" && t.department !== filterDept) return false;
      if (filterPriority !== "All" && t.priority !== filterPriority) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.title?.toLowerCase().includes(q) &&
            !t.ticket_number?.toLowerCase().includes(q) &&
            !t.description?.toLowerCase().includes(q) &&
            !t.assigned_to?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tickets, filterStatus, filterDept, filterPriority, search]);

  // Stats
  const stats = {
    open: tickets.filter(t => t.status === "Open").length,
    inProgress: tickets.filter(t => t.status === "In Progress").length,
    resolved: tickets.filter(t => t.status === "Resolved").length,
    urgent: tickets.filter(t => t.priority === "Urgent" && !["Resolved", "Closed"].includes(t.status)).length,
  };

  const handleEdit = (ticket) => {
    setDetailDialog({ open: false, ticket: null });
    setFormDialog({ open: true, ticket });
  };

  return (
    <div className="p-4 lg:p-8 max-w-screen-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operations</h1>
          <p className="text-sm text-slate-500 mt-0.5">Internal ticket system & request tracking</p>
        </div>
        <Button onClick={() => setFormDialog({ open: true, ticket: null })} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
          <Plus className="h-4 w-4" /> Open Ticket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Open", value: stats.open, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "In Progress", value: stats.inProgress, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Resolved", value: stats.resolved, color: "text-green-600", bg: "bg-green-50" },
          { label: "Urgent", value: stats.urgent, color: "text-red-600", bg: "bg-red-50" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl px-4 py-3 border border-slate-100`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map(s => {
            const count = s === "All" ? tickets.length : tickets.filter(t => t.status === s).length;
            const isActive = filterStatus === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  isActive
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                {s} <span className={`ml-1 ${isActive ? "text-indigo-500" : "text-slate-400"}`}>({count})</span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 ml-auto flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..." className="pl-8 h-9 w-44 text-sm" />
            {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><X className="h-3.5 w-3.5" /></button>}
          </div>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="h-9 w-36 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d === "All" ? "All Departments" : d}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="h-9 w-32 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p === "All" ? "All Priorities" : p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* Ticket grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="bg-slate-100 rounded-full p-5 mb-4">
            <Ticket className="h-10 w-10 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium text-base">No tickets found</p>
          <p className="text-slate-400 text-sm mt-1">Open a ticket to start tracking requests</p>
          <Button onClick={() => setFormDialog({ open: true, ticket: null })} className="mt-5 bg-indigo-600 hover:bg-indigo-700 gap-2">
            <Plus className="h-4 w-4" /> Open First Ticket
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <TicketCard
              key={t.id}
              ticket={t}
              messageCount={messageCountMap[t.id] || 0}
              onClick={() => setDetailDialog({ open: true, ticket: t })}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <TicketFormDialog
        open={formDialog.open}
        ticket={formDialog.ticket}
        onClose={() => setFormDialog({ open: false, ticket: null })}
        onSave={(form) => saveMutation.mutate(formDialog.ticket?.id ? { ...form, id: formDialog.ticket.id } : form)}
      />

      <TicketDetailDialog
        open={detailDialog.open}
        ticket={detailDialog.ticket}
        onClose={() => setDetailDialog({ open: false, ticket: null })}
        onEdit={handleEdit}
        onStatusChange={(ticket, status) => updateStatus.mutate({ ticket, status })}
      />
    </div>
  );
}