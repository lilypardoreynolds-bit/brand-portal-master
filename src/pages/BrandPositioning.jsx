import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart2, Pencil, Save, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ARCHETYPES = ["Hero", "Explorer", "Creator", "Caregiver", "Rebel", "Sage", "Innocent", "Lover", "Jester", "Ruler", "Everyman", "Magician"];
const ARCHETYPE_DESC = {
  Hero: "Courage, mastery, achievement", Explorer: "Adventure, freedom, discovery", Creator: "Imagination, innovation, artistry",
  Caregiver: "Nurturing, protection, generosity", Rebel: "Revolution, disruption, change", Sage: "Wisdom, truth, knowledge",
  Innocent: "Optimism, simplicity, trust", Lover: "Passion, intimacy, beauty", Jester: "Fun, joy, humor",
  Ruler: "Control, authority, leadership", Everyman: "Belonging, authenticity, community", Magician: "Transformation, vision, wonder",
};
const POSITIONS = ["Premium", "Mid-Range", "Budget"];
const EMPTY = { market_category: "", price_positioning: "", brand_personality: "", tone_of_voice: "", brand_archetype: "" };

export default function BrandPositioning() {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const qc = useQueryClient();

  const { data: items = [] } = useQuery({ queryKey: ["brand_overviews"], queryFn: () => base44.entities.BrandOverview.list(), initialData: [] });
  const brand = items[0];

  useEffect(() => {
    if (brand) setForm({ market_category: brand.market_category || "", price_positioning: brand.price_positioning || "", brand_personality: brand.brand_personality || "", tone_of_voice: brand.tone_of_voice || "", brand_archetype: brand.brand_archetype || "" });
  }, [brand]);

  const saveMutation = useMutation({
    mutationFn: d => brand ? base44.entities.BrandOverview.update(brand.id, d) : base44.entities.BrandOverview.create({ brand_name: "My Brand", ...d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["brand_overviews"] }); setEditing(false); },
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const positionColors = { Premium: "bg-amber-50 border-amber-200 text-amber-700", "Mid-Range": "bg-sky-50 border-sky-200 text-sky-700", Budget: "bg-slate-50 border-slate-200 text-slate-600" };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center"><BarChart2 className="h-5 w-5 text-sky-600" /></div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Brand Positioning</h2>
            <p className="text-sm text-slate-400">Where you stand in the market</p>
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

      {/* Price Positioning */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Market Position</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Market Category</Label>
            {editing ? <Input value={form.market_category} onChange={e => set("market_category", e.target.value)} placeholder="e.g. Premium Skincare, Sustainable Apparel" />
              : <p className={`text-sm ${form.market_category ? "text-slate-800" : "text-slate-300 italic"}`}>{form.market_category || "Not set"}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pricing Tier</Label>
            {editing ? (
              <div className="flex gap-2">
                {POSITIONS.map(p => (
                  <button key={p} onClick={() => set("price_positioning", p)}
                    className={cn("flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-all", form.price_positioning === p ? positionColors[p] : "border-slate-200 text-slate-400 hover:border-slate-300")}>
                    {p}
                  </button>
                ))}
              </div>
            ) : (
              form.price_positioning
                ? <span className={cn("inline-block px-3 py-1.5 rounded-lg text-sm font-semibold border", positionColors[form.price_positioning])}>{form.price_positioning}</span>
                : <p className="text-sm text-slate-300 italic">Not set</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Brand Archetype */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Brand Archetype</CardTitle></CardHeader>
        <CardContent>
          {editing ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {ARCHETYPES.map(a => (
                <button key={a} onClick={() => set("brand_archetype", a)}
                  className={cn("py-2 px-3 rounded-xl border text-xs font-semibold transition-all text-center", form.brand_archetype === a ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50")}>
                  {a}
                </button>
              ))}
            </div>
          ) : form.brand_archetype ? (
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg">{form.brand_archetype.charAt(0)}</div>
              <div>
                <p className="font-bold text-slate-900 text-lg">{form.brand_archetype}</p>
                <p className="text-sm text-slate-500 mt-0.5">{ARCHETYPE_DESC[form.brand_archetype]}</p>
              </div>
            </div>
          ) : <p className="text-sm text-slate-300 italic">No archetype selected</p>}
        </CardContent>
      </Card>

      {/* Personality & Tone */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Personality & Tone</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[{ key: "brand_personality", label: "Brand Personality" }, { key: "tone_of_voice", label: "Tone of Voice" }].map(f => (
            <div key={f.key} className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{f.label}</Label>
              {editing ? <Textarea rows={2} value={form[f.key]} onChange={e => set(f.key, e.target.value)} />
                : <p className={`text-sm leading-relaxed ${form[f.key] ? "text-slate-800" : "text-slate-300 italic"}`}>{form[f.key] || "Not set"}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}