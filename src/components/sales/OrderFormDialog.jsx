import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

const DEFAULT_ORDER = {
  order_number: "", order_date: "", customer_id: "", customer_name: "",
  sales_channel_id: "", sales_channel_name: "", order_status: "Pending",
  payment_status: "Pending", subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0, notes: ""
};

const DEFAULT_ITEM = { product_id: "", product_name: "", quantity: 1, unit_price: 0, discount: 0, line_total: 0 };

export default function OrderFormDialog({ open, onClose, order, onSave }) {
  const [form, setForm] = useState(DEFAULT_ORDER);
  const [items, setItems] = useState([{ ...DEFAULT_ITEM }]);
  const [saving, setSaving] = useState(false);

  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: () => base44.entities.Customer.list() });
  const { data: channels = [] } = useQuery({ queryKey: ["sales_channels"], queryFn: () => base44.entities.SalesChannel.list() });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => base44.entities.Product.list() });

  useEffect(() => {
    if (order) {
      setForm({ ...DEFAULT_ORDER, ...order });
    } else {
      const num = `ORD-${Date.now().toString().slice(-6)}`;
      setForm({ ...DEFAULT_ORDER, order_number: num, order_date: new Date().toISOString().split("T")[0] });
    }
  }, [order, open]);

  const set = (k, v) => setForm(f => recalcTotals({ ...f, [k]: v }));

  const recalcTotals = (f) => {
    const itemSub = items.reduce((s, i) => s + (i.line_total || 0), 0);
    const subtotal = itemSub > 0 ? itemSub : (f.subtotal || 0);
    const total = subtotal - (f.discount || 0) + (f.shipping || 0) + (f.tax || 0);
    return { ...f, subtotal, total };
  };

  const updateItem = (idx, k, v) => {
    const updated = items.map((item, i) => {
      if (i !== idx) return item;
      const newItem = { ...item, [k]: v };
      newItem.line_total = (newItem.quantity || 0) * (newItem.unit_price || 0) - (newItem.discount || 0);
      return newItem;
    });
    setItems(updated);
    const itemSub = updated.reduce((s, i) => s + (i.line_total || 0), 0);
    setForm(f => {
      const total = itemSub - (f.discount || 0) + (f.shipping || 0) + (f.tax || 0);
      return { ...f, subtotal: itemSub, total };
    });
  };

  const getPriceForChannel = (product, channelId) => {
    const channel = channels.find(c => c.id === channelId);
    const isWholesale = channel?.channel_name?.toLowerCase() === "wholesale";
    return isWholesale ? (product.wholesale_price || 0) : (product.retail_price || 0);
  };

  const selectProduct = (idx, productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const unitPrice = getPriceForChannel(product, form.sales_channel_id);
    const updated = items.map((item, i) => {
      if (i !== idx) return item;
      const newItem = { ...item, product_id: productId, product_name: product.name, unit_price: unitPrice };
      newItem.line_total = (newItem.quantity || 0) * (newItem.unit_price || 0) - (newItem.discount || 0);
      return newItem;
    });
    setItems(updated);
    const itemSub = updated.reduce((s, i) => s + (i.line_total || 0), 0);
    setForm(f => {
      const total = itemSub - (f.discount || 0) + (f.shipping || 0) + (f.tax || 0);
      return { ...f, subtotal: itemSub, total };
    });
  };

  const addItem = () => setItems(prev => [...prev, { ...DEFAULT_ITEM }]);
  const removeItem = (idx) => {
    const updated = items.filter((_, i) => i !== idx);
    setItems(updated);
    const itemSub = updated.reduce((s, i) => s + (i.line_total || 0), 0);
    setForm(f => {
      const total = itemSub - (f.discount || 0) + (f.shipping || 0) + (f.tax || 0);
      return { ...f, subtotal: itemSub, total };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(form, items);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{order ? "Edit Order" : "New Order"}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Order Number</Label><Input value={form.order_number} onChange={e => set("order_number", e.target.value)} className="mt-1" /></div>
            <div><Label>Order Date</Label><Input type="date" value={form.order_date} onChange={e => set("order_date", e.target.value)} className="mt-1" /></div>
            <div>
              <Label>Customer</Label>
              <Select value={form.customer_id} onValueChange={v => {
                const c = customers.find(x => x.id === v);
                set("customer_id", v);
                setForm(f => ({ ...f, customer_id: v, customer_name: c?.customer_name || "" }));
              }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.customer_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sales Channel</Label>
              <Select value={form.sales_channel_id} onValueChange={v => {
                const ch = channels.find(x => x.id === v);
                setForm(f => ({ ...f, sales_channel_id: v, sales_channel_name: ch?.channel_name || "" }));
                // Recalculate all item prices based on new channel
                const updated = items.map(item => {
                  if (!item.product_id) return item;
                  const product = products.find(p => p.id === item.product_id);
                  if (!product) return item;
                  const isWholesale = ch?.channel_name?.toLowerCase() === "wholesale";
                  const newPrice = isWholesale ? (product.wholesale_price || 0) : (product.retail_price || 0);
                  const newItem = { ...item, unit_price: newPrice };
                  newItem.line_total = (newItem.quantity || 0) * newPrice - (newItem.discount || 0);
                  return newItem;
                });
                setItems(updated);
                const itemSub = updated.reduce((s, i) => s + (i.line_total || 0), 0);
                setForm(f => ({
                  ...f, sales_channel_id: v, sales_channel_name: ch?.channel_name || "",
                  subtotal: itemSub, total: itemSub - (f.discount || 0) + (f.shipping || 0) + (f.tax || 0)
                }));
              }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select channel" /></SelectTrigger>
                <SelectContent>{channels.map(c => <SelectItem key={c.id} value={c.id}>{c.channel_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Order Status</Label>
              <Select value={form.order_status} onValueChange={v => set("order_status", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{["Pending","Processing","Shipped","Completed","Cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Status</Label>
              <Select value={form.payment_status} onValueChange={v => set("payment_status", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{["Paid","Pending","Refunded"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold">Order Items</Label>
              <Button variant="outline" size="sm" onClick={addItem} className="gap-1 text-xs"><Plus className="h-3 w-3" /> Add Item</Button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 rounded-lg p-2">
                  <div className="col-span-4">
                    <Select value={item.product_id} onValueChange={v => selectProduct(idx, v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Product" /></SelectTrigger>
                      <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                    {!item.product_id && <Input placeholder="Or type name" value={item.product_name} onChange={e => updateItem(idx, "product_name", e.target.value)} className="h-8 text-xs mt-1" />}
                  </div>
                  <div className="col-span-2"><Input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)} className="h-8 text-xs" /></div>
                  <div className="col-span-2"><Input type="number" placeholder="Price" value={item.unit_price} onChange={e => updateItem(idx, "unit_price", parseFloat(e.target.value) || 0)} className="h-8 text-xs" /></div>
                  <div className="col-span-2"><Input type="number" placeholder="Disc" value={item.discount} onChange={e => updateItem(idx, "discount", parseFloat(e.target.value) || 0)} className="h-8 text-xs" /></div>
                  <div className="col-span-1 text-xs font-medium text-slate-700 text-right">${(item.line_total || 0).toFixed(2)}</div>
                  <div className="col-span-1 text-right"><Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => removeItem(idx)}><Trash2 className="h-3.5 w-3.5" /></Button></div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Discount ($)</Label><Input type="number" value={form.discount} onChange={e => set("discount", parseFloat(e.target.value) || 0)} className="mt-1 h-8 text-sm" /></div>
              <div><Label className="text-xs">Shipping ($)</Label><Input type="number" value={form.shipping} onChange={e => set("shipping", parseFloat(e.target.value) || 0)} className="mt-1 h-8 text-sm" /></div>
              <div><Label className="text-xs">Tax ($)</Label><Input type="number" value={form.tax} onChange={e => set("tax", parseFloat(e.target.value) || 0)} className="mt-1 h-8 text-sm" /></div>
              <div className="flex flex-col justify-end"><p className="text-xs text-slate-500">Total</p><p className="text-2xl font-bold text-indigo-700">${(form.total || 0).toFixed(2)}</p></div>
            </div>
          </div>

          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} className="mt-1" /></div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.order_number} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? "Saving..." : "Save Order"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}