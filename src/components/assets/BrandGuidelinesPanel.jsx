import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload, X, FileText, Plus, Save, ExternalLink, Palette, Type, BookOpen, Volume2, CheckCircle, XCircle } from "lucide-react";

function ColorSwatch({ color, onRemove }) {
  return (
    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-2 py-1 group">
      <span className="h-4 w-4 rounded-full flex-shrink-0 border border-slate-200" style={{ backgroundColor: color }} />
      <span className="text-xs text-slate-700 font-mono">{color}</span>
      {onRemove && (
        <button onClick={onRemove} className="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function ColorInput({ colors = [], onChange, label }) {
  const [input, setInput] = useState("");
  const add = () => {
    const c = input.trim();
    if (!c || colors.includes(c)) return;
    onChange([...colors, c]);
    setInput("");
  };
  return (
    <div>
      <Label className="text-sm text-slate-600 block mb-1">{label}</Label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {colors.map((c, i) => (
          <ColorSwatch key={i} color={c} onRemove={() => onChange(colors.filter((_, j) => j !== i))} />
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="#000000 or name" className="text-sm h-8" />
        <input type="color" value={input || "#000000"} onChange={e => setInput(e.target.value)} className="h-8 w-8 rounded cursor-pointer border border-slate-200 p-0.5" />
        <Button size="sm" variant="outline" onClick={add} className="h-8 px-2"><Plus className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

export default function BrandGuidelinesPanel({ guideline, onSave }) {
  const [form, setForm] = useState(guideline || {
    primary_colors: [], secondary_colors: [], typography_heading: "", typography_body: "",
    typography_notes: "", logo_usage_rules: "", visual_style: "", brand_voice: "",
    dos: "", donts: "", guideline_document_url: "", last_updated: ""
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("guideline_document_url", file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...form, last_updated: new Date().toISOString().split("T")[0] });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Colors */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-4 w-4 text-indigo-500" />
          <h3 className="font-semibold text-slate-800">Brand Colors</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <ColorInput label="Primary Colors" colors={form.primary_colors || []} onChange={v => set("primary_colors", v)} />
          <ColorInput label="Secondary Colors" colors={form.secondary_colors || []} onChange={v => set("secondary_colors", v)} />
        </div>
      </div>

      {/* Typography */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Type className="h-4 w-4 text-indigo-500" />
          <h3 className="font-semibold text-slate-800">Typography</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Heading Font</Label>
            <Input value={form.typography_heading} onChange={e => set("typography_heading", e.target.value)} className="mt-1" placeholder="e.g. Playfair Display" />
          </div>
          <div>
            <Label>Body Font</Label>
            <Input value={form.typography_body} onChange={e => set("typography_body", e.target.value)} className="mt-1" placeholder="e.g. Inter" />
          </div>
        </div>
        <div className="mt-3">
          <Label>Typography Notes</Label>
          <Textarea value={form.typography_notes} onChange={e => set("typography_notes", e.target.value)} rows={2} className="mt-1" placeholder="Size hierarchy, weights, line spacing..." />
        </div>
      </div>

      {/* Logo & Visual */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-4 w-4 text-indigo-500" />
          <h3 className="font-semibold text-slate-800">Logo & Visual Style</h3>
        </div>
        <div className="space-y-3">
          <div>
            <Label>Logo Usage Rules</Label>
            <Textarea value={form.logo_usage_rules} onChange={e => set("logo_usage_rules", e.target.value)} rows={3} className="mt-1" placeholder="Minimum sizes, clear space, approved variations, prohibited uses..." />
          </div>
          <div>
            <Label>Visual Style</Label>
            <Textarea value={form.visual_style} onChange={e => set("visual_style", e.target.value)} rows={3} className="mt-1" placeholder="Imagery style, photography guidelines, graphic elements..." />
          </div>
        </div>
      </div>

      {/* Brand Voice */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="h-4 w-4 text-indigo-500" />
          <h3 className="font-semibold text-slate-800">Brand Voice</h3>
        </div>
        <div>
          <Label>Brand Voice Description</Label>
          <Textarea value={form.brand_voice} onChange={e => set("brand_voice", e.target.value)} rows={3} className="mt-1" placeholder="Tone, personality, communication style..." />
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              <Label className="text-green-700">Do's</Label>
            </div>
            <Textarea value={form.dos} onChange={e => set("dos", e.target.value)} rows={3} className="mt-1 text-sm border-green-200 focus:ring-green-300" placeholder="Things to do with the brand..." />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              <Label className="text-red-700">Don'ts</Label>
            </div>
            <Textarea value={form.donts} onChange={e => set("donts", e.target.value)} rows={3} className="mt-1 text-sm border-red-200 focus:ring-red-300" placeholder="Things to avoid with the brand..." />
          </div>
        </div>
      </div>

      {/* Guideline Document */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-indigo-500" />
          <h3 className="font-semibold text-slate-800">Official Brand Guidelines Document</h3>
        </div>
        <input ref={fileInputRef} type="file" accept=".pdf,.ai,.sketch,.fig,.xd,.pptx" className="hidden" onChange={handleDocUpload} />
        {form.guideline_document_url ? (
          <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <FileText className="h-6 w-6 text-indigo-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-indigo-800">Brand Guidelines Document</p>
              <a href={form.guideline_document_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center gap-1">
                <ExternalLink className="h-3 w-3" /> Open document
              </a>
            </div>
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="text-xs">Replace</Button>
            <button onClick={() => set("guideline_document_url", "")} className="text-slate-400 hover:text-red-500"><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-slate-200 rounded-lg py-6 flex flex-col items-center gap-2 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
          >
            {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
            <span className="text-sm">{uploading ? "Uploading..." : "Upload brand guidelines (PDF, AI, Figma, etc.)"}</span>
          </button>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700">
        {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save Brand Guidelines</>}
      </Button>
    </div>
  );
}