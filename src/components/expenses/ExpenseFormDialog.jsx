import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import FileUploader from "@/components/shared/FileUploader";

export default function ExpenseFormDialog({ open, onClose, onSave, expense, defaultCategory, categories }) {
  const today = format(new Date(), "yyyy-MM-dd");

  const blank = () => ({
    date: today,
    expense_name: "",
    category: "",
    vendor: "",
    amount: "",
    expense_type: "Variable",
    payment_status: "Paid",
    notes: "",
    attachment_url: "",
    is_recurring: false,
    recurrence_frequency: "Monthly"
  });

  const [form, setForm] = useState(blank());
  const [isCustom, setIsCustom] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  useEffect(() => {
    if (!open) return;
    if (expense) {
      setForm({ ...expense, amount: expense.amount?.toString() || "" });
      const isKnown = categories.includes(expense.category);
      setIsCustom(!isKnown && !!expense.category);
      setCustomCategory(!isKnown ? (expense.category || "") : "");
    } else {
      const cat = defaultCategory || "";
      setForm({ ...blank(), expense_name: defaultCategory ? defaultCategory : "", category: cat });
      setIsCustom(false);
      setCustomCategory("");
    }
  }, [open, expense, defaultCategory]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCategoryChange = (val) => {
    if (val === "__custom__") {
      setIsCustom(true);
      set("category", customCategory);
    } else {
      setIsCustom(false);
      setCustomCategory("");
      set("category", val);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalCategory = isCustom ? customCategory : form.category;
    onSave({ ...form, category: finalCategory, amount: parseFloat(form.amount) || 0 });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{expense ? "Edit Expense" : "Add Expense"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={e => set("amount", e.target.value)} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Expense Name *</Label>
            <Input placeholder="e.g. Amazon FBA Fee" value={form.expense_name} onChange={e => set("expense_name", e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={isCustom ? "__custom__" : (form.category || "")} onValueChange={handleCategoryChange}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  <SelectItem value="__custom__">+ Custom Category</SelectItem>
                </SelectContent>
              </Select>
              {isCustom && (
                <Input
                  className="mt-1"
                  placeholder="Enter custom category"
                  value={customCategory}
                  onChange={e => { setCustomCategory(e.target.value); set("category", e.target.value); }}
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Vendor / Supplier</Label>
              <Input placeholder="e.g. Alibaba" value={form.vendor} onChange={e => set("vendor", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Expense Type</Label>
              <Select value={form.expense_type} onValueChange={v => set("expense_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fixed">Fixed</SelectItem>
                  <SelectItem value="Variable">Variable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Status</Label>
              <Select value={form.payment_status} onValueChange={v => set("payment_status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Recurring toggle */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Recurring Expense</p>
                <p className="text-xs text-slate-400">Automatically added each period</p>
              </div>
              <button
                type="button"
                onClick={() => set("is_recurring", !form.is_recurring)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${form.is_recurring ? "bg-indigo-600" : "bg-slate-300"}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${form.is_recurring ? "translate-x-4" : "translate-x-1"}`} />
              </button>
            </div>
            {form.is_recurring && (
              <div className="space-y-1.5">
                <Label>Recurrence Frequency</Label>
                <Select value={form.recurrence_frequency} onValueChange={v => set("recurrence_frequency", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea placeholder="Optional notes..." value={form.notes} onChange={e => set("notes", e.target.value)} className="h-20" />
          </div>

          <div className="space-y-1.5">
            <Label>Attachment <span className="text-slate-400 font-normal">(Receipt / Invoice)</span></Label>
            <FileUploader value={form.attachment_url} onChange={v => set("attachment_url", v)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{expense ? "Save Changes" : "Add Expense"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}