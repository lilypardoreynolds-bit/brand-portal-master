import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EMPTY = { date: "", bucket: "marketing", description: "", amount: "", category: "", reference: "", notes: "" };

const MARKETING_CATEGORIES = ["Paid Ads", "Content Creation", "Influencer", "Events", "Design", "Other"];
const CASHFLOW_CATEGORIES = ["Emergency Reserve", "Operations", "Equipment", "Payroll", "Other"];

export default function BudgetAllocationDialog({ open, allocation, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (allocation) {
      setForm({ ...EMPTY, ...allocation });
    } else {
      setForm({ ...EMPTY, date: new Date().toISOString().split("T")[0] });
    }
  }, [allocation, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    onSave({ ...form, amount: parseFloat(form.amount) || 0 });
    onClose();
  };

  const categories = form.bucket === "marketing" ? MARKETING_CATEGORIES : CASHFLOW_CATEGORIES;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{allocation ? "Edit Allocation" : "Register Allocation"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Date *</Label>
              <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Amount ($) *</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e => set("amount", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Budget Bucket *</Label>
            <Select value={form.bucket} onValueChange={v => set("bucket", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="marketing">📣 Marketing (5%)</SelectItem>
                <SelectItem value="cashflow">🐷 Cash Flow (5%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Category</Label>
            <Select value={form.category} onValueChange={v => set("category", v)}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Description *</Label>
            <Input placeholder="e.g. Instagram ads — May campaign" value={form.description} onChange={e => set("description", e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Reference (optional)</Label>
            <Input placeholder="Receipt #, invoice #..." value={form.reference} onChange={e => set("reference", e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.date || !form.amount || !form.description}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}