import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Save, X } from "lucide-react";

const FIELDS = [
  { key: "description", label: "Description", type: "textarea" },
  { key: "problem_solved", label: "Problem the Product Solves", type: "textarea" },
  { key: "target_audience", label: "Target Audience", type: "input" },
  { key: "strategic_fit", label: "Strategic Fit with Brand", type: "textarea" },
  { key: "notes", label: "Notes", type: "textarea" },
];

export default function ProductConceptTab({ idea, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setForm({
      description: idea.description || "",
      problem_solved: idea.problem_solved || "",
      target_audience: idea.target_audience || "",
      strategic_fit: idea.strategic_fit || "",
      notes: idea.notes || ""
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(form);
    setSaving(false);
    setEditing(false);
  };

  return (
    <Card className="mt-4 border border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold text-slate-800">Product Concept</CardTitle>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={startEdit} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5" /></Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 gap-1">
              <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {FIELDS.map(f => (
          <div key={f.key}>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{f.label}</Label>
            {editing ? (
              f.type === "textarea" ? (
                <Textarea className="mt-1" rows={3} value={form[f.key] || ""} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
              ) : (
                <Input className="mt-1" value={form[f.key] || ""} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
              )
            ) : (
              <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
                {idea[f.key] || <span className="text-slate-400 italic">Not filled in</span>}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}