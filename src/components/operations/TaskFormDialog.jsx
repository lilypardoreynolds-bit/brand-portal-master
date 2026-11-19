import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Paperclip, X, Loader2, FileText, Upload } from "lucide-react";
import { format } from "date-fns";

const PRIORITIES = ["Low", "Medium", "High"];
const STATUSES = ["To Do", "In Progress", "Review", "Completed"];
const MODULES = ["Marketing", "Product", "Sales", "Inventory", "Strategy", "Operations", "Brand", "Other"];

const DEFAULT = {
  task_name: "", description: "", assigned_to: "", priority: "Medium",
  status: "To Do", start_date: "", due_date: "", project_id: "", project_name: "",
  related_module: "", file_urls: [], notes: ""
};

export default function TaskFormDialog({ open, onClose, task, onSave, projects = [] }) {
  const [form, setForm] = useState(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  useEffect(() => {
    setForm(task ? { ...DEFAULT, ...task, file_urls: task.file_urls || [] } : DEFAULT);
  }, [task, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleProjectChange = (projectId) => {
    const proj = projects.find(p => p.id === projectId);
    set("project_id", projectId);
    set("project_name", proj?.project_name || "");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("file_urls", [...(form.file_urls || []), file_url]);
    setUploading(false);
  };

  const removeFile = (url) => set("file_urls", form.file_urls.filter(u => u !== url));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  const priorityColors = { Low: "text-green-600 bg-green-50", Medium: "text-amber-600 bg-amber-50", High: "text-red-600 bg-red-50" };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Task Name *</Label>
            <Input value={form.task_name} onChange={e => set("task_name", e.target.value)} className="mt-1" placeholder="What needs to be done?" />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} className="mt-1" placeholder="Task details..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => set("priority", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Assigned To</Label>
            <Select value={form.assigned_to || "none"} onValueChange={v => set("assigned_to", v === "none" ? "" : v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select user..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {users.map(user => <SelectItem key={user.email} value={user.email}>{user.full_name} ({user.email})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Project</Label>
              <Select value={form.project_id || "none"} onValueChange={v => handleProjectChange(v === "none" ? "" : v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Related Module</Label>
              <Select value={form.related_module || "none"} onValueChange={v => set("related_module", v === "none" ? "" : v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {MODULES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* File Attachments */}
          <div>
            <Label className="block mb-2">Attachments</Label>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
            <div className="space-y-1.5 mb-2">
              {(form.file_urls || []).map((url, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <FileText className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                  <a href={url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline truncate flex-1">
                    File {i + 1}
                  </a>
                  <button onClick={() => removeFile(url)} className="text-slate-400 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
              {uploading ? "Uploading..." : "Attach File"}
            </button>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} className="mt-1" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.task_name.trim()} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? "Saving..." : "Save Task"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}