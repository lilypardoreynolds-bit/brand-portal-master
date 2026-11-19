import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { Paperclip, X, Loader2 } from "lucide-react";

const DEPARTMENTS = ["Marketing", "Sales", "Operations", "Inventory", "Finance", "Product", "Brand", "Other"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const STATUSES = ["Open", "In Progress", "Pending", "Resolved", "Closed"];

const EMPTY = {
  title: "", description: "", department: "", priority: "Medium",
  status: "Open", assigned_to: "", requester_name: "", attachment_urls: []
};

export default function TicketFormDialog({ open, ticket, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm(ticket ? { ...EMPTY, ...ticket } : EMPTY);
  }, [ticket, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    set("attachment_urls", [...(form.attachment_urls || []), ...urls]);
    setUploading(false);
  };

  const removeAttachment = (url) => {
    set("attachment_urls", form.attachment_urls.filter(u => u !== url));
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  const isEdit = !!ticket?.id;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit Ticket ${ticket.ticket_number || ""}` : "Open New Ticket"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1">
            <Label className="text-xs">Title *</Label>
            <Input placeholder="Brief description of the issue" value={form.title} onChange={e => set("title", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Department *</Label>
              <Select value={form.department} onValueChange={v => set("department", v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Priority</Label>
              <Select value={form.priority} onValueChange={v => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Assigned To</Label>
              <Input placeholder="Responsible person" value={form.assigned_to} onChange={e => set("assigned_to", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Requester</Label>
              <Input placeholder="Who requested?" value={form.requester_name} onChange={e => set("requester_name", e.target.value)} />
            </div>
          </div>

          {isEdit && (
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Textarea rows={4} placeholder="Describe the issue in detail..." value={form.description} onChange={e => set("description", e.target.value)} />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label className="text-xs">Attachments</Label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-500 hover:text-slate-700 border border-dashed border-slate-300 rounded-lg px-3 py-2">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              {uploading ? "Uploading..." : "Attach files"}
              <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
            {(form.attachment_urls || []).length > 0 && (
              <div className="space-y-1">
                {form.attachment_urls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded px-2 py-1">
                    <Paperclip className="h-3 w-3 flex-shrink-0" />
                    <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate hover:underline">{url.split("/").pop()}</a>
                    <button onClick={() => removeAttachment(url)}><X className="h-3 w-3 text-slate-400 hover:text-red-500" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.title || !form.department}>
              {isEdit ? "Save Changes" : "Open Ticket"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}