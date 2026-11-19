import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb, Pencil, Save, X, Loader2, Sparkles } from "lucide-react";

const EMPTY = { main_problem_solved: "", unique_solution: "", key_benefits: "", why_choose_us: "", usp: "" };

export default function BrandValue() {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const qc = useQueryClient();

  const { data: items = [] } = useQuery({ queryKey: ["brand_overviews"], queryFn: () => base44.entities.BrandOverview.list(), initialData: [] });
  const brand = items[0];

  useEffect(() => {
    if (brand) setForm({ main_problem_solved: brand.main_problem_solved || "", unique_solution: brand.unique_solution || "", key_benefits: brand.key_benefits || "", why_choose_us: brand.why_choose_us || "", usp: brand.usp || "" });
  }, [brand]);

  const saveMutation = useMutation({
    mutationFn: d => brand ? base44.entities.BrandOverview.update(brand.id, d) : base44.entities.BrandOverview.create({ brand_name: "My Brand", ...d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["brand_overviews"] }); setEditing(false); },
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const sections = [
    { key: "main_problem_solved", label: "Main Problem the Brand Solves", hint: "What frustration or gap does your brand address?" },
    { key: "unique_solution", label: "Unique Solution", hint: "How does your brand solve this differently?" },
    { key: "key_benefits", label: "Key Benefits", hint: "What tangible outcomes do customers get?" },
    { key: "why_choose_us", label: "Why Customers Should Choose This Brand", hint: "What makes you the obvious choice?" },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Lightbulb className="h-5 w-5 text-emerald-600" /></div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Value Proposition</h2>
            <p className="text-sm text-slate-400">Why your brand exists and who it's for</p>
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

      {/* USP Hero */}
      <Card className={`border-2 ${editing ? "border-indigo-200 bg-indigo-50" : "border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50"}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <p className="text-sm font-bold text-emerald-700 uppercase tracking-wider">Unique Selling Proposition (USP)</p>
          </div>
          {editing
            ? <Textarea rows={3} value={form.usp} onChange={e => set("usp", e.target.value)} placeholder="The single most compelling reason someone should choose you over everyone else..." className="bg-white" />
            : <p className={`text-lg leading-relaxed font-medium ${form.usp ? "text-slate-800" : "text-slate-300 italic text-base"}`}>{form.usp || "Your USP goes here — the one statement that defines your brand's unique value."}</p>
          }
        </CardContent>
      </Card>

      {/* Other sections */}
      <div className="space-y-4">
        {sections.map(s => (
          <Card key={s.key} className="border-slate-200">
            <CardContent className="p-5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{s.label}</Label>
              {editing
                ? <Textarea rows={3} value={form[s.key]} onChange={e => set(s.key, e.target.value)} placeholder={s.hint} className="mt-2 resize-none" />
                : <p className={`text-sm mt-2 leading-relaxed ${form[s.key] ? "text-slate-800" : "text-slate-300 italic"}`}>{form[s.key] || s.hint}</p>
              }
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}