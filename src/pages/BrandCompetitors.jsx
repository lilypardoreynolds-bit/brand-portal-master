import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Swords, Plus, Pencil, Trash2, Loader2, ExternalLink, Upload, Paperclip } from "lucide-react";

const EMPTY = { competitor_name: "", website: "", price_range: "", strengths: "", weaknesses: "", marketing_channels: "", product_differentiation: "", screenshot_urls: [], notes: "" };

export default function BrandCompetitors() {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();

  const { data: competitors = [] } = useQuery({
    queryKey: ["competitors"],
    queryFn: () => base44.entities.Competitor.list("-created_date"),
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: d => editItem ? base44.entities.Competitor.update(editItem.id, d) : base44.entities.Competitor.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["competitors"] }); setOpen(false); setEditItem(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.Competitor.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["competitors"] }),
  });

  const openNew = () => { setEditItem(null); setForm(EMPTY); setOpen(true); };
  const openEdit = item => { setEditItem(item); setForm({ ...EMPTY, ...item, screenshot_urls: item.screenshot_urls || [] }); setOpen(true); };
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(p => ({ ...p, screenshot_urls: [...(p.screenshot_urls || []), file_url] }));
    setUploading(false);
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center"><Swords className="h-5 w-5 text-violet-600" /></div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Competitor Analysis</h2>
            <p className="text-sm text-slate-400">Understand your competitive landscape</p>
          </div>
        </div>
        <Button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 gap-2"><Plus className="h-4 w-4" /> Add Competitor</Button>
      </div>

      {competitors.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Swords className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No competitors tracked yet.</p>
          <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={openNew}>Add First Competitor</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {competitors.map(c => (
            <Card key={c.id} className="border-slate-200 hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-lg">{c.competitor_name}</p>
                      {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600"><ExternalLink className="h-4 w-4" /></a>}
                    </div>
                    {c.price_range && <p className="text-xs text-slate-400 mt-0.5">Price Range: {c.price_range}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5 text-slate-400" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="h-3.5 w-3.5 text-slate-400" /></Button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {c.strengths && (
                    <div className="bg-emerald-50 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Strengths</p>
                      <p className="text-xs text-slate-700">{c.strengths}</p>
                    </div>
                  )}
                  {c.weaknesses && (
                    <div className="bg-rose-50 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1">Weaknesses</p>
                      <p className="text-xs text-slate-700">{c.weaknesses}</p>
                    </div>
                  )}
                  {c.marketing_channels && (
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Marketing Channels</p>
                      <p className="text-xs text-slate-700">{c.marketing_channels}</p>
                    </div>
                  )}
                  {c.product_differentiation && (
                    <div className="bg-indigo-50 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Differentiation</p>
                      <p className="text-xs text-slate-700">{c.product_differentiation}</p>
                    </div>
                  )}
                </div>
                {c.screenshot_urls?.length > 0 && (
                  <div className="mt-3 flex items-center gap-1 text-xs text-indigo-500"><Paperclip className="h-3 w-3" />{c.screenshot_urls.length} file{c.screenshot_urls.length > 1 ? "s" : ""} attached</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={() => { setOpen(false); setEditItem(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? "Edit Competitor" : "New Competitor"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1"><Label>Competitor Name *</Label><Input value={form.competitor_name} onChange={e => set("competitor_name", e.target.value)} /></div>
              <div className="space-y-1"><Label>Website</Label><Input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://" /></div>
              <div className="space-y-1"><Label>Price Range</Label><Input value={form.price_range} onChange={e => set("price_range", e.target.value)} placeholder="e.g. $20–$80" /></div>
            </div>
            <div className="space-y-1"><Label>Strengths</Label><Textarea rows={2} value={form.strengths} onChange={e => set("strengths", e.target.value)} /></div>
            <div className="space-y-1"><Label>Weaknesses</Label><Textarea rows={2} value={form.weaknesses} onChange={e => set("weaknesses", e.target.value)} /></div>
            <div className="space-y-1"><Label>Marketing Channels Used</Label><Input value={form.marketing_channels} onChange={e => set("marketing_channels", e.target.value)} /></div>
            <div className="space-y-1"><Label>Product Differentiation</Label><Textarea rows={2} value={form.product_differentiation} onChange={e => set("product_differentiation", e.target.value)} /></div>
            <div className="space-y-1"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} /></div>
            <div>
              <Label>Screenshots / Files</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {(form.screenshot_urls || []).map((url, i) => <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">File {i + 1}</a>)}
                <label className="cursor-pointer flex items-center gap-1 text-xs text-slate-500 border border-dashed border-slate-300 px-3 py-1.5 rounded hover:bg-slate-50">
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Upload
                  <input type="file" className="hidden" onChange={handleUpload} />
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setEditItem(null); }}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.competitor_name} className="bg-indigo-600 hover:bg-indigo-700">
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}