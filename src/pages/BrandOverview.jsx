import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Compass, Pencil, Save, X, Loader2 } from "lucide-react";

const EMPTY = {
  brand_name: "", tagline: "", mission_statement: "", vision: "",
  core_values: "", brand_story: "", strategic_notes: ""
};

const Field = ({ label, value, editing, fieldKey, onChange, long = false }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</Label>
    {editing ? (
      long
        ? <Textarea rows={4} value={value || ""} onChange={e => onChange(fieldKey, e.target.value)} className="resize-none" />
        : <Input value={value || ""} onChange={e => onChange(fieldKey, e.target.value)} />
    ) : (
      <p className={`text-sm leading-relaxed ${value ? "text-slate-800" : "text-slate-300 italic"}`}>
        {value || "Not set"}
      </p>
    )}
  </div>
);

export default function BrandOverview() {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const qc = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["brand_overviews"],
    queryFn: () => base44.entities.BrandOverview.list(),
    initialData: [],
  });

  const brand = items[0];

  useEffect(() => {
    if (brand) setForm({ ...EMPTY, ...brand });
  }, [brand]);

  const saveMutation = useMutation({
    mutationFn: (data) => brand
      ? base44.entities.BrandOverview.update(brand.id, data)
      : base44.entities.BrandOverview.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["brand_overviews"] }); setEditing(false); },
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const startEdit = () => {
    if (!brand) setForm(EMPTY);
    setEditing(true);
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Compass className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Brand Overview</h2>
            <p className="text-sm text-slate-400">The soul and story of your brand</p>
          </div>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setEditing(false); if (brand) setForm({ ...EMPTY, ...brand }); }}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.brand_name} className="bg-indigo-600 hover:bg-indigo-700">
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />} Save
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={startEdit}><Pencil className="h-4 w-4 mr-1" /> Edit</Button>
        )}
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Identity</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <Field label="Brand Name" value={form.brand_name} editing={editing} fieldKey="brand_name" onChange={set} />
          <Field label="Tagline" value={form.tagline} editing={editing} fieldKey="tagline" onChange={set} />
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Purpose</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <Field label="Mission Statement" value={form.mission_statement} editing={editing} fieldKey="mission_statement" onChange={set} long />
          <Field label="Vision" value={form.vision} editing={editing} fieldKey="vision" onChange={set} long />
          <Field label="Core Values" value={form.core_values} editing={editing} fieldKey="core_values" onChange={set} long />
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Story</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <Field label="Brand Story" value={form.brand_story} editing={editing} fieldKey="brand_story" onChange={set} long />
          <Field label="Strategic Notes" value={form.strategic_notes} editing={editing} fieldKey="strategic_notes" onChange={set} long />
        </CardContent>
      </Card>

      {!brand && !editing && (
        <div className="text-center py-10 text-slate-400">
          <Compass className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No brand overview yet.</p>
          <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={startEdit}>Get Started</Button>
        </div>
      )}
    </div>
  );
}