import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COLORS = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#64748b"];

const DEFAULT = { name: "", description: "", color: "#6366f1", icon: "" };

export default function CategoryFormDialog({ open, onClose, category, onSave }) {
  const [form, setForm] = useState(DEFAULT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(category ? { ...DEFAULT, ...category } : DEFAULT);
  }, [category, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "New Category"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Category Name *</Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} className="mt-1" placeholder="e.g. Event Materials" />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={form.description} onChange={e => set("description", e.target.value)} className="mt-1" placeholder="Optional description" />
          </div>
          <div>
            <Label className="block mb-2">Color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("color", c)}
                  style={{ backgroundColor: c }}
                  className={`h-7 w-7 rounded-full transition-transform ${form.color === c ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "hover:scale-105"}`}
                />
              ))}
            </div>
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