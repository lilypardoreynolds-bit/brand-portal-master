import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutDashboard, Plus, Pencil, Trash2, Upload, Loader2, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

const CONTENT_TYPES = ["Photo", "Video", "Graphic"];
const PLATFORMS = ["instagram", "tiktok", "youtube", "pinterest", "website", "multi"];
const TOOLS = ["CapCut", "Holo", "Adobe Premiere", "Final Cut", "Canva", "Photoshop", "Other"];
const STATUSES = ["Idea", "Recording", "Editing", "Ready to Post", "Published"];

const STATUS_COLORS = {
  Idea: "bg-slate-100 text-slate-600",
  Recording: "bg-amber-100 text-amber-700",
  Editing: "bg-violet-100 text-violet-700",
  "Ready to Post": "bg-blue-100 text-blue-700",
  Published: "bg-emerald-100 text-emerald-700",
};

const DEFAULT = { title: "", content_type: "Photo", platform_target: "instagram", creator: "", editing_tool: "CapCut", status: "Idea", notes: "", file_urls: [] };

export default function MarketingContent() {
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(DEFAULT);
  const [uploading, setUploading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const qc = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["content_productions"],
    queryFn: () => base44.entities.ContentProduction.list("-created_date"),
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editItem ? base44.entities.ContentProduction.update(editItem.id, data) : base44.entities.ContentProduction.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["content_productions"] }); setShowDialog(false); setEditItem(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ContentProduction.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content_productions"] }),
  });

  const openEdit = (item) => { setEditItem(item); setForm({ ...DEFAULT, ...item }); setShowDialog(true); };
  const openNew = () => { setEditItem(null); setForm(DEFAULT); setShowDialog(true); };
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(p => ({ ...p, file_urls: [...(p.file_urls || []), file_url] }));
    setUploading(false);
  };

  const filtered = filterStatus === "all" ? items : items.filter(i => i.status === filterStatus);

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center"><LayoutDashboard className="h-5 w-5 text-violet-600" /></div>
          <div><h2 className="text-xl font-bold text-slate-900">Content Creation</h2><p className="text-sm text-slate-400">Manage your content production pipeline</p></div>
        </div>
        <Button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 gap-2"><Plus className="h-4 w-4" /> Add Content</Button>
      </div>

      {/* Pipeline Summary */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterStatus("all")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all", filterStatus === "all" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")}>
          All ({items.length})
        </button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all", filterStatus === s ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")}>
            {s} ({items.filter(i => i.status === s).length})
          </button>
        ))}
      </div>

      {/* Content Grid */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="py-16 flex flex-col items-center gap-3">
            <p className="text-slate-400 text-sm">No content in this stage yet.</p>
            <Button onClick={openNew} variant="outline" size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Add Content</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <Card key={item.id} className="border-slate-200 hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <Badge className={cn("text-xs", STATUS_COLORS[item.status] || "bg-slate-100 text-slate-600")}>{item.status}</Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(item)}><Pencil className="h-3 w-3 text-slate-400" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="h-3 w-3 text-slate-400" /></Button>
                  </div>
                </div>
                <p className="font-semibold text-slate-900 text-sm leading-snug mb-2">{item.title}</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Type</span><span className="text-slate-600 font-medium">{item.content_type}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Platform</span><span className="text-slate-600 font-medium capitalize">{item.platform_target}</span>
                  </div>
                  {item.creator && <div className="flex items-center justify-between text-xs text-slate-400"><span>Creator</span><span className="text-slate-600 font-medium">{item.creator}</span></div>}
                  {item.editing_tool && <div className="flex items-center justify-between text-xs text-slate-400"><span>Tool</span><span className="text-slate-600 font-medium">{item.editing_tool}</span></div>}
                </div>
                {item.file_urls?.length > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-indigo-500"><Paperclip className="h-3 w-3" />{item.file_urls.length} file{item.file_urls.length > 1 ? "s" : ""}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={() => { setShowDialog(false); setEditItem(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? "Edit Content" : "New Content"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Title *</Label><Input value={form.title} onChange={e => set("title", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Content Type</Label>
                <Select value={form.content_type} onValueChange={v => set("content_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Platform Target</Label>
                <Select value={form.platform_target} onValueChange={v => set("platform_target", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Creator</Label><Input value={form.creator} onChange={e => set("creator", e.target.value)} /></div>
              <div className="space-y-1"><Label>Editing Tool</Label>
                <Select value={form.editing_tool} onValueChange={v => set("editing_tool", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TOOLS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1"><Label>Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={e => set("notes", e.target.value)} /></div>
            <div>
              <Label>Files</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {(form.file_urls || []).map((url, i) => <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">File {i + 1}</a>)}
                <label className="cursor-pointer flex items-center gap-1 text-xs text-slate-500 border border-dashed border-slate-300 px-3 py-1.5 rounded hover:bg-slate-50">
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Upload
                  <input type="file" className="hidden" onChange={handleUpload} />
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setEditItem(null); }}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.title} className="bg-indigo-600 hover:bg-indigo-700">
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}