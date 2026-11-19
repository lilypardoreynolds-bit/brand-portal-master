import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mic2, Pencil, Save, X, Loader2, CheckCircle2, XCircle } from "lucide-react";

const EMPTY = { brand_voice_description: "", key_messaging_pillars: "", words_to_use: "", words_to_avoid: "", brand_promise: "" };

const Field = ({ label, value, editing, fieldKey, onChange, rows = 3, accent }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</Label>
    {editing
      ? <Textarea rows={rows} value={value || ""} onChange={e => onChange(fieldKey, e.target.value)} className="resize-none" />
      : value
        ? <p className={`text-sm leading-relaxed ${accent || "text-slate-800"}`}>{value}</p>
        : <p className="text-sm text-slate-300 italic">Not set</p>
    }
  </div>
);

export default function BrandMessaging() {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const qc = useQueryClient();

  const { data: items = [] } = useQuery({ queryKey: ["brand_overviews"], queryFn: () => base44.entities.BrandOverview.list(), initialData: [] });
  const brand = items[0];

  useEffect(() => {
    if (brand) setForm({ brand_voice_description: brand.brand_voice_description || "", key_messaging_pillars: brand.key_messaging_pillars || "", words_to_use: brand.words_to_use || "", words_to_avoid: brand.words_to_avoid || "", brand_promise: brand.brand_promise || "" });
  }, [brand]);

  const saveMutation = useMutation({
    mutationFn: d => brand ? base44.entities.BrandOverview.update(brand.id, d) : base44.entities.BrandOverview.create({ brand_name: "My Brand", ...d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["brand_overviews"] }); setEditing(false); },
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center"><Mic2 className="h-5 w-5 text-orange-600" /></div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Voice & Messaging</h2>
            <p className="text-sm text-slate-400">How your brand speaks and what it stands for</p>
          </div>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}><X className="h-4 w-4 mr-1" /> Cancel</Button>
            <Button size="sm" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />} Save
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil className="h-4 w-4 mr-1" /> Edit</Button>
        )}
      </div>

      {/* Brand Promise */}
      <Card className="border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50">
        <CardContent className="p-5">
          <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">Brand Promise</p>
          {editing
            ? <Textarea rows={2} value={form.brand_promise} onChange={e => set("brand_promise", e.target.value)} className="bg-white" placeholder="The commitment you make to every customer..." />
            : <p className={`text-base leading-relaxed font-medium ${form.brand_promise ? "text-slate-800" : "text-slate-300 italic text-sm"}`}>{form.brand_promise || "Define your brand promise"}</p>
          }
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Brand Voice</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <Field label="Brand Voice Description" value={form.brand_voice_description} editing={editing} fieldKey="brand_voice_description" onChange={set} rows={3} />
          <Field label="Key Messaging Pillars" value={form.key_messaging_pillars} editing={editing} fieldKey="key_messaging_pillars" onChange={set} rows={4} />
        </CardContent>
      </Card>

      {/* Words grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="border-emerald-100 bg-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <Label className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Words to Use</Label>
            </div>
            {editing
              ? <Textarea rows={4} value={form.words_to_use} onChange={e => set("words_to_use", e.target.value)} className="bg-white text-sm resize-none" placeholder="Empowering, Authentic, Bold..." />
              : form.words_to_use
                ? <div className="flex flex-wrap gap-1.5">{form.words_to_use.split(/[,\n]+/).filter(Boolean).map((w, i) => <span key={i} className="bg-white text-emerald-700 text-xs px-2 py-1 rounded-full border border-emerald-200">{w.trim()}</span>)}</div>
                : <p className="text-xs text-slate-300 italic">Not set</p>
            }
          </CardContent>
        </Card>
        <Card className="border-rose-100 bg-rose-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="h-4 w-4 text-rose-600" />
              <Label className="text-xs font-bold text-rose-700 uppercase tracking-wider">Words to Avoid</Label>
            </div>
            {editing
              ? <Textarea rows={4} value={form.words_to_avoid} onChange={e => set("words_to_avoid", e.target.value)} className="bg-white text-sm resize-none" placeholder="Cheap, Generic, Ordinary..." />
              : form.words_to_avoid
                ? <div className="flex flex-wrap gap-1.5">{form.words_to_avoid.split(/[,\n]+/).filter(Boolean).map((w, i) => <span key={i} className="bg-white text-rose-700 text-xs px-2 py-1 rounded-full border border-rose-200">{w.trim()}</span>)}</div>
                : <p className="text-xs text-slate-300 italic">Not set</p>
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}