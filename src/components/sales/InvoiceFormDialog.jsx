import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEFAULT = { invoice_number: "", invoice_date: "", customer_id: "", customer_name: "", company_name: "", ship_to_name: "", ship_to_address: "", ship_to_city: "", ship_to_state: "", ship_to_zip: "", ship_to_country: "", order_id: "", order_number: "", subtotal: 0, discount: 0, tax: 0, total_amount: 0, payment_status: "Pending", payment_link: "", notes: "" };

export default function InvoiceFormDialog({ open, onClose, invoice, onSave }) {
  const [form, setForm] = useState(DEFAULT);
  const [saving, setSaving] = useState(false);

  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: () => base44.entities.Customer.list() });
  const { data: orders = [] } = useQuery({ queryKey: ["orders"], queryFn: () => base44.entities.Order.list() });

  useEffect(() => {
    if (invoice?.id) {
      setForm({ ...DEFAULT, ...invoice });
    } else {
      setForm({ ...DEFAULT, ...invoice, invoice_number: `INV-${Date.now().toString().slice(-6)}`, invoice_date: new Date().toISOString().split("T")[0] });
    }
  }, [invoice, open]);

  const set = (k, v) => setForm(f => {
    const updated = { ...f, [k]: v };
    updated.total_amount = (parseFloat(updated.subtotal) || 0) - (parseFloat(updated.discount) || 0) + (parseFloat(updated.tax) || 0);
    return updated;
  });

  const selectOrder = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    setForm(f => ({
      ...f,
      order_id: orderId,
      order_number: order.order_number,
      customer_id: order.customer_id || f.customer_id,
      customer_name: order.customer_name || f.customer_name,
      company_name: order.company_name || f.company_name,
      subtotal: order.subtotal || 0,
      tax: order.tax || 0,
      total_amount: order.total || ((order.subtotal || 0) + (order.tax || 0)),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const dataToSave = { ...form };
    await onSave(dataToSave);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{invoice ? "Edit Invoice" : "Create Invoice"}</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Invoice Number</Label><Input value={form.invoice_number} onChange={e => set("invoice_number", e.target.value)} className="mt-1" disabled={form.order_id && !invoice?.id} /></div>
            <div><Label>Invoice Date</Label><Input type="date" value={form.invoice_date} onChange={e => set("invoice_date", e.target.value)} className="mt-1" /></div>
          </div>
          <div>
             <Label>Customer</Label>
             <Select value={form.customer_id} onValueChange={v => {
               const c = customers.find(x => x.id === v);
               setForm(f => ({ 
                 ...f, 
                 customer_id: v, 
                 customer_name: c?.customer_name || "",
                 company_name: c?.company_name || "",
                 ship_to_name: c?.customer_name || "",
                 ship_to_address: c?.ship_to_address || c?.address || "",
                 ship_to_city: c?.ship_to_city || c?.city || "",
                 ship_to_state: c?.ship_to_state || c?.state || "",
                 ship_to_zip: c?.ship_to_zip || c?.zip_code || "",
                 ship_to_country: c?.ship_to_country || c?.country || ""
               }));
             }}>
               <SelectTrigger className="mt-1"><SelectValue placeholder="Select customer" /></SelectTrigger>
               <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.customer_name}</SelectItem>)}</SelectContent>
             </Select>
           </div>
          <div>
            <Label>Company Name</Label>
            <Input value={form.company_name} onChange={e => set("company_name", e.target.value)} placeholder="Company name (optional)" className="mt-1" />
          </div>
          <div>
            <Label>Linked Order</Label>
            <Select value={form.order_id} onValueChange={selectOrder}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select order (optional)" /></SelectTrigger>
              <SelectContent>{orders.map(o => <SelectItem key={o.id} value={o.id}>{o.order_number}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Subtotal ($)</Label><Input type="number" value={form.subtotal} onChange={e => set("subtotal", parseFloat(e.target.value) || 0)} className="mt-1" /></div>
            <div><Label>Discount ($)</Label><Input type="number" min="0" value={form.discount} onChange={e => set("discount", parseFloat(e.target.value) || 0)} className="mt-1" placeholder="0.00" /></div>
            <div><Label>Tax ($)</Label><Input type="number" value={form.tax} onChange={e => set("tax", parseFloat(e.target.value) || 0)} className="mt-1" /></div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Total Amount</span>
            <span className="text-xl font-bold text-indigo-700">${(form.total_amount || 0).toFixed(2)}</span>
          </div>
          <div>
            <Label>Payment Status</Label>
            <Select value={form.payment_status} onValueChange={v => set("payment_status", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{["Paid","Pending","Overdue","Refunded"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Payment Link</Label>
            <Input value={form.payment_link} onChange={e => set("payment_link", e.target.value)} placeholder="Wise payment link (optional)" className="mt-1" />
          </div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} className="mt-1" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.invoice_number.trim()} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? "Saving..." : "Save Invoice"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}