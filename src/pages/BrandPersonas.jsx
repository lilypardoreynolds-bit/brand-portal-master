import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Plus, Pencil, Trash2, Loader2, Upload } from "lucide-react";

const EMPTY = {
  persona_name: "", age: "", occupation: "", goals: "", problems: "",
  buying_behavior: "", favorite_platforms: "", typical_day: "", avatar_url: "", notes: ""
};

export default function BrandPersonas() {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();

  const { data: personas = [] } = useQuery({
    queryKey: ["customer_personas"],
    queryFn: () => base44.entities.CustomerPersona.list("-created_date"),
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: d => editItem ? base44.entities.CustomerPersona.update(editItem.id, d) : base44.entities.CustomerPersona.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customer_personas"] }); setOpen(false); setEditItem(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.CustomerPersona.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customer_personas"] }),
  });

  const openNew = () => { setEditItem(null); setForm(EMPTY); setOpen(true); };
  const openEdit = item => { setEditItem(item); setForm({ ...EMPTY, ...item }); setOpen(true); };
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("avatar_url", file_url);
    setUploading(false);
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center"><Users className="h-5 w-5 text-amber-600" /></div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Customer Personas</h2>
            <p className="text-sm text-slate-400">Know your buyers deeply</p>
          </div>
        </div>
        <Button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 gap-2"><Plus className="h-4 w-4" /> Add Persona</Button>
      </div>

      {personas.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No personas yet.</p>
          <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={openNew}>Create First Persona</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {personas.map(p => (
            <Card key={p.id} className="border-slate-200 hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {p.avatar_url
                      ? <img src={p.avatar_url} alt={p.persona_name} className="h-12 w-12 rounded-full object-cover border-2 border-slate-200" />
                      : <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg">{p.persona_name?.charAt(0)}</div>
                    }
                    <div>
                      <p className="font-semibold text-slate-900">{p.persona_name}</p>
                      <p className="text-xs text-slate-400">{p.occupation || "—"}{p.age ? `, ${p.age}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5 text-slate-400" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="h-3.5 w-3.5 text-slate-400" /></Button>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {p.goals && <div><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Goals</p><p className="text-xs text-slate-700 mt-0.5">{p.goals}</p></div>}
                  {p.problems && <div><p className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">Pain Points</p><p className="text-xs text-slate-700 mt-0.5">{p.problems}</p></div>}
                  {p.favorite_platforms && <div><p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Platforms</p><p className="text-xs text-slate-700 mt-0.5">{p.favorite_platforms}</p></div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={() => { setOpen(false); setEditItem(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? "Edit Persona" : "New Customer Persona"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              {form.avatar_url
                ? <img src={form.avatar_url} alt="avatar" className="h-16 w-16 rounded-full object-cover border-2 border-slate-200" />
                : <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl">{form.persona_name?.charAt(0) || "?"}</div>
              }
              <label className="cursor-pointer flex items-center gap-2 text-xs text-slate-500 border border-dashed border-slate-300 px-3 py-2 rounded-lg hover:bg-slate-50">
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Upload Avatar
                <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1"><Label>Persona Name *</Label><Input value={form.persona_name} onChange={e => set("persona_name", e.target.value)} placeholder="e.g. Sarah the Entrepreneur" /></div>
              <div className="space-y-1"><Label>Age</Label><Input type="number" value={form.age} onChange={e => set("age", e.target.value)} /></div>
              <div className="space-y-1"><Label>Occupation</Label><Input value={form.occupation} onChange={e => set("occupation", e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label>Goals</Label><Textarea rows={2} value={form.goals} onChange={e => set("goals", e.target.value)} /></div>
            <div className="space-y-1"><Label>Problems / Pain Points</Label><Textarea rows={2} value={form.problems} onChange={e => set("problems", e.target.value)} /></div>
            <div className="space-y-1"><Label>Buying Behavior</Label><Textarea rows={2} value={form.buying_behavior} onChange={e => set("buying_behavior", e.target.value)} /></div>
            <div className="space-y-1"><Label>Favorite Platforms</Label><Input value={form.favorite_platforms} onChange={e => set("favorite_platforms", e.target.value)} placeholder="e.g. Instagram, TikTok, Pinterest" /></div>
            <div className="space-y-1"><Label>Typical Day Description</Label><Textarea rows={3} value={form.typical_day} onChange={e => set("typical_day", e.target.value)} /></div>
            <div className="space-y-1"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setEditItem(null); }}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.persona_name} className="bg-indigo-600 hover:bg-indigo-700">
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}