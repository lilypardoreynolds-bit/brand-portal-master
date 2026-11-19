import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Dna } from "lucide-react";

const CATEGORIES = ["Food & Beverage","Beauty & Skincare","Supplements & Health","Apparel & Fashion","Home & Lifestyle","Tech & Gadgets","Pets","Kids & Baby","Sports & Fitness","Other"];
const PRICE_POSITIONS = ["Budget","Mid-Range","Premium","Luxury"];
const GENDERS = ["Male","Female","All Genders","Non-Binary"];

export default function BrandDNAForm({ form, onChange, onGenerate, generating }) {
  const set = (k, v) => onChange({ ...form, [k]: v });
  const isReady = form.category && form.target_market && form.problem_solved && form.price_positioning;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center">
          <Dna className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Brand DNA</h2>
          <p className="text-sm text-slate-400">Define your brand concept, then let AI build your complete brand blueprint</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Brand Name */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Brand Name <span className="text-slate-300">(optional — AI will suggest if empty)</span></Label>
          <Input value={form.brand_name || ""} onChange={e => set("brand_name", e.target.value)} placeholder="e.g. Luminos, VitaCore..." />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category *</Label>
          <Select value={form.category || ""} onValueChange={v => set("category", v)}>
            <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {/* Price Positioning */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Price Positioning *</Label>
          <Select value={form.price_positioning || ""} onValueChange={v => set("price_positioning", v)}>
            <SelectTrigger><SelectValue placeholder="Select positioning..." /></SelectTrigger>
            <SelectContent>{PRICE_POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {/* Target Gender */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Gender</Label>
          <Select value={form.target_gender || ""} onValueChange={v => set("target_gender", v)}>
            <SelectTrigger><SelectValue placeholder="Select gender..." /></SelectTrigger>
            <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {/* Target Age Range */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Age Range</Label>
          <Input value={form.target_age_range || ""} onChange={e => set("target_age_range", e.target.value)} placeholder="e.g. 25–40, Gen Z, Millennials..." />
        </div>

        {/* Core Product Type */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Core Product Type</Label>
          <Input value={form.core_product_type || ""} onChange={e => set("core_product_type", e.target.value)} placeholder="e.g. Protein powder, Face serum..." />
        </div>

        {/* Target Market */}
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Market *</Label>
          <Textarea rows={2} value={form.target_market || ""} onChange={e => set("target_market", e.target.value)} placeholder="Describe who you're selling to (e.g. health-conscious women 25–40 who want clean beauty products)" className="resize-none" />
        </div>

        {/* Problem Solved */}
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Problem the Brand Solves *</Label>
          <Textarea rows={2} value={form.problem_solved || ""} onChange={e => set("problem_solved", e.target.value)} placeholder="What pain point or need does your brand address? (e.g. lack of affordable, clean skincare without harmful chemicals)" className="resize-none" />
        </div>
      </div>

      <Button
        onClick={onGenerate}
        disabled={!isReady || generating}
        className="w-full bg-violet-600 hover:bg-violet-700 h-12 text-base font-semibold gap-2"
      >
        {generating ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Generating Brand Blueprint...</>
        ) : (
          <><Sparkles className="h-4 w-4" /> Generate Brand Blueprint with AI</>
        )}
      </Button>

      {!isReady && (
        <p className="text-xs text-center text-slate-400">Fill in the required fields (*) to generate your brand blueprint</p>
      )}
    </div>
  );
}