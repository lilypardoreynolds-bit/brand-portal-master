import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUSES = ["Idea", "Research", "Prototype", "Testing", "Production", "Ready to Launch"];
const DEFAULT = { name: "", category: "", description: "", problem_solved: "", target_audience: "", strategic_fit: "", status: "Idea", notes: "" };

export default function ProductIdeaFormDialog({ open, idea, onClose, onSave }) {
  const [form, setForm] = useState(DEFAULT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(idea ? { ...DEFAULT, ...idea } : DEFAULT);
  }, [idea, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{idea ? "Edit Product Idea" : "New Product Idea"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Product Idea Name *</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Bamboo Travel Mug" className="mt-1" />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={form.category} onChange={e => set("category", e.target.value)} placeholder="e.g. Drinkware" className="mt-1" />
            </div>
            <div>
              <Label>Idea Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} className="mt-1" />
          </div>
          <div>
            <Label>Problem the Product Solves</Label>
            <Textarea value={form.problem_solved} onChange={e => set("problem_solved", e.target.value)} rows={2} className="mt-1" />
          </div>
          <div>
            <Label>Target Audience</Label>
            <Input value={form.target_audience} onChange={e => set("target_audience", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Strategic Fit with Brand</Label>
            <Textarea value={form.strategic_fit} onChange={e => set("strategic_fit", e.target.value)} rows={2} className="mt-1" />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} className="mt-1" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}