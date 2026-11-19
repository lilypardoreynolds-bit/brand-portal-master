import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Target, Plus, Pencil, Trash2, Loader2, User2 } from "lucide-react";
import { cn } from "@/lib/utils";

const EMPTY = {
  audience_name: "", primary_audience: "", age_range: "", gender: "",
  income_level: "", location: "", interests: "", lifestyle: "", pain_points: "", buying_motivations: "", notes: ""
};

const COLORS = ["bg-rose-50 border-rose-100 text-rose-700", "bg-amber-50 border-amber-100 text-amber-700", "bg-indigo-50 border-indigo-100 text-indigo-700", "bg-emerald-50 border-emerald-100 text-emerald-700"];

export default function BrandAudience() {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const qc = useQueryClient();

  const { data: audiences = [] } = useQuery({
    queryKey: ["target_audiences"],
    queryFn: () => base44.entities.TargetAudience.list("-created_date"),
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: d => editItem ? base44.entities.TargetAudience.update(editItem.id, d) : base44.entities.TargetAudience.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["target_audiences"] }); setOpen(false); setEditItem(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.TargetAudience.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["target_audiences"] }),
  });

  const openNew = () => { setEditItem(null); setForm(EMPTY); setOpen(true); };
  const openEdit = item => { setEditItem(item); setForm({ ...EMPTY, ...item }); setOpen(true); };
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center"><Target className="h-5 w-5 text-rose-600" /></div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Target Audience</h2>
            <p className="text-sm text-slate-400">Define who you're speaking to</p>
          </div>
        </div>
        <Button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 gap-2"><Plus className="h-4 w-4" /> Add Audience</Button>
      </div>

      {audiences.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No audience profiles yet.</p>
          <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={openNew}>Add First Profile</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {audiences.map((a, i) => (
            <Card key={a.id} className={cn("border", COLORS[i % COLORS.length].split(" ").slice(1).join(" "))}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-9 w-9 rounded-full flex items-center justify-center", COLORS[i % COLORS.length].split(" ").slice(0, 2).join(" "))}>
                      <User2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{a.audience_name}</p>
                      {a.primary_audience && <p className="text-xs text-slate-500">{a.primary_audience}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5 text-slate-400" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(a.id)}><Trash2 className="h-3.5 w-3.5 text-slate-400" /></Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Age Range", val: a.age_range },
                    { label: "Gender", val: a.gender },
                    { label: "Income", val: a.income_level },
                    { label: "Location", val: a.location },
                  ].filter(r => r.val).map(r => (
                    <div key={r.label} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{r.label}</span>
                      <span className="text-slate-700 font-medium">{r.val}</span>
                    </div>
                  ))}
                  {a.interests && <div className="pt-2 border-t border-slate-100"><p className="text-xs text-slate-400 mb-1">Interests</p><p className="text-xs text-slate-700">{a.interests}</p></div>}
                  {a.pain_points && <div className="pt-2"><p className="text-xs text-slate-400 mb-1">Pain Points</p><p className="text-xs text-slate-700">{a.pain_points}</p></div>}
                  {a.buying_motivations && <div className="pt-2"><p className="text-xs text-slate-400 mb-1">Buying Motivations</p><p className="text-xs text-slate-700">{a.buying_motivations}</p></div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={() => { setOpen(false); setEditItem(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? "Edit Audience" : "New Audience Profile"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Profile Name *</Label><Input value={form.audience_name} onChange={e => set("audience_name", e.target.value)} placeholder="e.g. Primary Audience" /></div>
            <div className="space-y-1"><Label>Primary Audience Description</Label><Input value={form.primary_audience} onChange={e => set("primary_audience", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Age Range</Label><Input value={form.age_range} onChange={e => set("age_range", e.target.value)} placeholder="e.g. 25–40" /></div>
              <div className="space-y-1"><Label>Gender</Label><Input value={form.gender} onChange={e => set("gender", e.target.value)} /></div>
              <div className="space-y-1"><Label>Income Level</Label><Input value={form.income_level} onChange={e => set("income_level", e.target.value)} /></div>
              <div className="space-y-1"><Label>Location</Label><Input value={form.location} onChange={e => set("location", e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label>Interests</Label><Textarea rows={2} value={form.interests} onChange={e => set("interests", e.target.value)} /></div>
            <div className="space-y-1"><Label>Lifestyle</Label><Textarea rows={2} value={form.lifestyle} onChange={e => set("lifestyle", e.target.value)} /></div>
            <div className="space-y-1"><Label>Pain Points</Label><Textarea rows={2} value={form.pain_points} onChange={e => set("pain_points", e.target.value)} /></div>
            <div className="space-y-1"><Label>Buying Motivations</Label><Textarea rows={2} value={form.buying_motivations} onChange={e => set("buying_motivations", e.target.value)} /></div>
            <div className="space-y-1"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setEditItem(null); }}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.audience_name} className="bg-indigo-600 hover:bg-indigo-700">
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}