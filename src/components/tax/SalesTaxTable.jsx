import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, DollarSign, Receipt } from "lucide-react";
import { fmt, calcTaxForEntry } from "./TaxUtils";
import { format } from "date-fns";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

const EMPTY = { order_id: "", order_date: "", sales_channel: "", customer_name: "", state: "", product: "", revenue: "", tax_rate: "", tax_exempt: false, resale_certificate_number: "", notes: "" };

export default function SalesTaxTable() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  const { data: entries = [] } = useQuery({
    queryKey: ["sales_tax_entries"],
    queryFn: () => base44.entities.SalesTaxEntry.list("-order_date", 500),
    initialData: [],
  });

  const save = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.SalesTaxEntry.update(editing, data)
      : base44.entities.SalesTaxEntry.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sales_tax_entries"] }); setOpen(false); setEditing(null); setForm(EMPTY); },
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.SalesTaxEntry.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales_tax_entries"] }),
  });

  const openNew = () => { setForm(EMPTY); setEditing(null); setOpen(true); };
  const openEdit = (e) => { setForm({ ...e, revenue: e.revenue ?? "", tax_rate: e.tax_rate ?? "" }); setEditing(e.id); setOpen(true); };

  const handleSubmit = () => {
    const rev = parseFloat(form.revenue) || 0;
    const rate = parseFloat(form.tax_rate) || 0;
    const tax = form.tax_exempt ? 0 : parseFloat((rev * rate / 100).toFixed(2));
    save.mutate({ ...form, revenue: rev, tax_rate: rate, tax_collected: tax });
  };

  const totalRevenue = entries.reduce((s, e) => s + (e.revenue || 0), 0);
  const totalTax = entries.reduce((s, e) => s + (e.tax_collected || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Revenue", value: fmt(totalRevenue), icon: DollarSign, color: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "Total Tax Collected", value: fmt(totalTax), icon: Receipt, color: "text-indigo-700", bg: "bg-indigo-50" },
          { label: "Total Entries", value: entries.length, icon: null, color: "text-slate-700", bg: "bg-slate-50" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.bg} flex flex-col gap-1`}>
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Sales Tax Entries</h3>
        <Button onClick={openNew} size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Add Entry</Button>
      </div>

      <Card className="border-slate-200">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Order ID","Date","Channel","Customer","State","Product","Revenue","Tax Rate","Tax Collected","Exempt","Cert #",""].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.length === 0 && (
                <tr><td colSpan={12} className="text-center py-10 text-slate-400 text-sm">No entries yet. Add your first sales tax entry.</td></tr>
              )}
              {entries.map(e => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-600">{e.order_id || "—"}</td>
                  <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{e.order_date ? format(new Date(e.order_date), "MMM d, yyyy") : "—"}</td>
                  <td className="px-3 py-2.5 text-slate-600">{e.sales_channel || "—"}</td>
                  <td className="px-3 py-2.5 text-slate-600">{e.customer_name || "—"}</td>
                  <td className="px-3 py-2.5"><span className="font-semibold text-slate-700">{e.state}</span></td>
                  <td className="px-3 py-2.5 text-slate-600">{e.product || "—"}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">{fmt(e.revenue)}</td>
                  <td className="px-3 py-2.5 text-slate-600">{e.tax_rate ? `${e.tax_rate}%` : "—"}</td>
                  <td className="px-3 py-2.5 font-semibold text-emerald-700">{fmt(e.tax_collected)}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant={e.tax_exempt ? "outline" : "secondary"} className={e.tax_exempt ? "border-amber-300 text-amber-700 bg-amber-50" : "bg-slate-100 text-slate-600"}>
                      {e.tax_exempt ? "Exempt" : "Taxable"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-500 font-mono">{e.resale_certificate_number || "—"}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(e)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => del.mutate(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Sales Tax Entry</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Order ID</label><Input value={form.order_id} onChange={e => setForm(f => ({ ...f, order_id: e.target.value }))} /></div>
            <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Order Date *</label><Input type="date" value={form.order_date} onChange={e => setForm(f => ({ ...f, order_date: e.target.value }))} /></div>
            <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Sales Channel</label><Input value={form.sales_channel} onChange={e => setForm(f => ({ ...f, sales_channel: e.target.value }))} placeholder="e.g. Amazon, Shopify" /></div>
            <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Customer Name</label><Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} /></div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">State *</label>
              <Select value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v }))}>
                <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Product</label><Input value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))} /></div>
            <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Revenue ($) *</label><Input type="number" min="0" step="0.01" value={form.revenue} onChange={e => setForm(f => ({ ...f, revenue: e.target.value }))} /></div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Tax Exempt</label>
              <Select value={form.tax_exempt ? "yes" : "no"} onValueChange={v => setForm(f => ({ ...f, tax_exempt: v === "yes" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="no">No</SelectItem><SelectItem value="yes">Yes</SelectItem></SelectContent>
              </Select>
            </div>
            {!form.tax_exempt && (
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Tax Rate (%)</label><Input type="number" min="0" step="0.01" value={form.tax_rate} onChange={e => setForm(f => ({ ...f, tax_rate: e.target.value }))} placeholder="e.g. 6.5" /></div>
            )}
            {form.tax_exempt && (
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Resale Certificate #</label><Input value={form.resale_certificate_number} onChange={e => setForm(f => ({ ...f, resale_certificate_number: e.target.value }))} /></div>
            )}
            <div className="space-y-1 col-span-2"><label className="text-xs font-medium text-slate-600">Notes</label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          {!form.tax_exempt && form.revenue && form.tax_rate && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm text-indigo-800">
              Calculated Tax: <strong>{fmt(parseFloat(form.revenue) * parseFloat(form.tax_rate) / 100)}</strong>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={save.isPending}>{save.isPending ? "Saving..." : "Save Entry"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}