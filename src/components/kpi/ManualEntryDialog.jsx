import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const METRICS_BY_CATEGORY = {
  sales: ["Total Revenue", "Total Orders", "Average Order Value", "Units Sold", "Revenue Growth"],
  efficiency: ["Order Fulfillment Time (hrs)", "Inventory Turnover Rate", "Operational Costs", "Profit Margin (%)"],
  customer: ["Customer Rating (1-5)", "Number of Complaints", "Customer Retention Rate (%)", "Repeat Purchase Rate (%)"],
  inventory: ["Total Inventory Value", "Stock Turnover Rate", "Low Stock Products", "Out of Stock Products"],
};

export default function ManualEntryDialog({ open, onClose, onSave, category }) {
  const [form, setForm] = useState({
    category: category || "sales",
    metric: "",
    value: "",
    period: new Date().toISOString().split("T")[0],
    period_type: "month",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const metrics = METRICS_BY_CATEGORY[form.category] || [];

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...form, value: parseFloat(form.value) || 0 });
    setSaving(false);
    setForm({ category: category || "sales", metric: "", value: "", period: new Date().toISOString().split("T")[0], period_type: "month", notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add KPI Entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => { update("category", v); update("metric", ""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="efficiency">Efficiency</SelectItem>
                <SelectItem value="customer">Customer Satisfaction</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Metric</Label>
            <Select value={form.metric} onValueChange={(v) => update("metric", v)}>
              <SelectTrigger><SelectValue placeholder="Select metric" /></SelectTrigger>
              <SelectContent>
                {metrics.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Value</Label>
              <Input type="number" value={form.value} onChange={(e) => update("value", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Period Type</Label>
              <Select value={form.period_type} onValueChange={(v) => update("period_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={form.period} onChange={(e) => update("period", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={2} placeholder="Optional context..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.metric || !form.value} className="bg-indigo-600 hover:bg-indigo-700">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save Entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}