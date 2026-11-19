import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";
import { useAppSettings } from "@/lib/appSettings";

const EMPTY_ITEM = { product_name: "", sku: "", quantity: 1, unit_price: 0, discount: 0, line_total: 0 };

function calcLineTotal(item) {
  const gross = (item.quantity || 0) * (item.unit_price || 0);
  const disc = gross * ((item.discount || 0) / 100);
  return +(gross - disc).toFixed(2);
}

export default function InvoiceFormDialog({ open, onClose, onSaved, invoice, nextInvoiceNumber }) {
  const today = new Date().toISOString().split("T")[0];
  const { settings, defaultTaxRate } = useAppSettings();
  const brandFooter = settings.invoice_legal_footer ||
    `${settings.brand_name || "The company"} is the brand owner and authorized distributor of the products listed above.\nAll goods are authentic and manufactured by an approved facility in compliance with industry standards.\nThis invoice reflects a legitimate B2B transaction.`;

  const defaultForm = {
    invoice_number: nextInvoiceNumber || "INV-0001",
    invoice_date: today,
    due_date: "",
    status: "Draft",
    customer_name: "",
    company_name: "",
    customer_type: "Wholesale",
    customer_address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "United States",
    customer_email: "",
    customer_phone: "",
    tax_exempt: false,
    resale_certificate_number: "",
    tax_rate: defaultTaxRate,
    shipping: 0,
    notes: "",
    ship_to_name: "",
    ship_to_address: "",
    ship_to_city: "",
    ship_to_state: "",
    ship_to_zip: "",
    ship_to_country: "United States",
    ship_to_phone: "",
    legal_footer: brandFooter,
  };

  const [form, setForm] = useState(defaultForm);
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [saving, setSaving] = useState(false);

  const { data: existingItems = [] } = useQuery({
    queryKey: ["wholesale_invoice_items", invoice?.id],
    queryFn: () => base44.entities.WholesaleInvoiceItem.filter({ invoice_id: invoice.id }),
    enabled: !!invoice?.id,
    initialData: [],
  });

  useEffect(() => {
    if (invoice) {
      setForm({ ...defaultForm, ...invoice });
      if (existingItems.length > 0) setItems(existingItems);
    } else {
      setForm({ ...defaultForm, invoice_number: nextInvoiceNumber || "INV-0001" });
      setItems([{ ...EMPTY_ITEM }]);
    }
  }, [invoice, existingItems, nextInvoiceNumber]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const updateItem = (idx, k, v) => {
    setItems((prev) => {
      const updated = prev.map((item, i) => {
        if (i !== idx) return item;
        const newItem = { ...item, [k]: v };
        newItem.line_total = calcLineTotal(newItem);
        return newItem;
      });
      return updated;
    });
  };

  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const subtotal = items.reduce((s, i) => s + (i.line_total || 0), 0);
  const discountTotal = items.reduce((s, i) => {
    const gross = (i.quantity || 0) * (i.unit_price || 0);
    return s + (gross - (i.line_total || 0));
  }, 0);
  const taxAmount = form.tax_exempt ? 0 : +(subtotal * ((form.tax_rate || 0) / 100)).toFixed(2);
  const shipping = +(form.shipping || 0);
  const total = +(subtotal + taxAmount + shipping).toFixed(2);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      ...form,
      subtotal: +subtotal.toFixed(2),
      discount_total: +discountTotal.toFixed(2),
      tax_amount: taxAmount,
      shipping,
      total,
    };
    let savedInvoice;
    if (invoice?.id) {
      savedInvoice = await base44.entities.WholesaleInvoice.update(invoice.id, payload);
      // Delete old items and recreate
      for (const oldItem of existingItems) {
        await base44.entities.WholesaleInvoiceItem.delete(oldItem.id);
      }
    } else {
      savedInvoice = await base44.entities.WholesaleInvoice.create(payload);
    }
    for (const item of items) {
      if (item.product_name) {
        await base44.entities.WholesaleInvoiceItem.create({
          ...item,
          invoice_id: savedInvoice.id,
          line_total: calcLineTotal(item),
        });
      }
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? "Edit Invoice" : "New Wholesale Invoice"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Invoice Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Invoice Number</Label>
              <Input
                value={form.invoice_number}
                onChange={(e) => set("invoice_number", e.target.value)}
                className={!invoice ? "bg-slate-100 text-slate-500" : ""}
                placeholder="Auto-generated"
              />
              {!invoice && <p className="text-xs text-slate-400 mt-0.5">Auto-generated</p>}
            </div>
            <div>
              <Label>Invoice Date</Label>
              <Input type="date" value={form.invoice_date} onChange={(e) => set("invoice_date", e.target.value)} />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Draft", "Sent", "Paid", "Overdue", "Cancelled"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-3 border rounded-xl p-4 bg-slate-50">
            <p className="font-semibold text-slate-700 text-sm">Customer Information</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Customer Name *</Label>
                <Input value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} />
              </div>
              <div>
                <Label>Company Name</Label>
                <Input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} />
              </div>
              <div>
                <Label>Customer Type</Label>
                <Select value={form.customer_type} onValueChange={(v) => set("customer_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Wholesale", "Distributor", "Retail Partner"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.customer_email} onChange={(e) => set("customer_email", e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.customer_phone} onChange={(e) => set("customer_phone", e.target.value)} />
              </div>
              <div>
                <Label>Address</Label>
                <Input value={form.customer_address} onChange={(e) => set("customer_address", e.target.value)} />
              </div>
              <div>
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>State</Label>
                  <Input value={form.state} onChange={(e) => set("state", e.target.value)} />
                </div>
                <div>
                  <Label>ZIP</Label>
                  <Input value={form.zip_code} onChange={(e) => set("zip_code", e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Country</Label>
                <Input value={form.country} onChange={(e) => set("country", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Ship To */}
          <div className="space-y-3 border rounded-xl p-4 bg-slate-50">
            <p className="font-semibold text-slate-700 text-sm">Ship To</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Recipient Name</Label>
                <Input value={form.ship_to_name} onChange={(e) => set("ship_to_name", e.target.value)} placeholder="e.g. Diego Hansen - YAP" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.ship_to_phone} onChange={(e) => set("ship_to_phone", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>Address</Label>
                <Input value={form.ship_to_address} onChange={(e) => set("ship_to_address", e.target.value)} />
              </div>
              <div>
                <Label>City</Label>
                <Input value={form.ship_to_city} onChange={(e) => set("ship_to_city", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>State</Label>
                  <Input value={form.ship_to_state} onChange={(e) => set("ship_to_state", e.target.value)} />
                </div>
                <div>
                  <Label>ZIP</Label>
                  <Input value={form.ship_to_zip} onChange={(e) => set("ship_to_zip", e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Country</Label>
                <Input value={form.ship_to_country} onChange={(e) => set("ship_to_country", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Tax Settings */}
          <div className="space-y-3 border rounded-xl p-4 bg-slate-50">
            <p className="font-semibold text-slate-700 text-sm">Tax Settings</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.tax_exempt} onCheckedChange={(v) => set("tax_exempt", v)} />
                <Label>Tax Exempt</Label>
              </div>
              {!form.tax_exempt && (
                <div className="flex items-center gap-2">
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    className="w-24"
                    value={form.tax_rate}
                    onChange={(e) => set("tax_rate", parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}
              {form.tax_exempt && (
                <div className="flex-1">
                  <Label>Resale Certificate #</Label>
                  <Input value={form.resale_certificate_number} onChange={(e) => set("resale_certificate_number", e.target.value)} />
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <p className="font-semibold text-slate-700 text-sm">Products / Line Items</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-slate-500 text-xs">
                    <th className="text-left pb-2 pr-2 font-medium">Product</th>
                    <th className="text-left pb-2 pr-2 font-medium w-24">SKU</th>
                    <th className="text-left pb-2 pr-2 font-medium w-20">Qty</th>
                    <th className="text-left pb-2 pr-2 font-medium w-24">Unit Price</th>
                    <th className="text-left pb-2 pr-2 font-medium w-20">Disc %</th>
                    <th className="text-right pb-2 font-medium w-24">Line Total</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-1.5 pr-2">
                        <Input value={item.product_name} onChange={(e) => updateItem(idx, "product_name", e.target.value)} placeholder="Product name" />
                      </td>
                      <td className="py-1.5 pr-2">
                        <Input value={item.sku} onChange={(e) => updateItem(idx, "sku", e.target.value)} placeholder="SKU" />
                      </td>
                      <td className="py-1.5 pr-2">
                        <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)} />
                      </td>
                      <td className="py-1.5 pr-2">
                        <Input type="number" min={0} step="0.01" value={item.unit_price} onChange={(e) => updateItem(idx, "unit_price", parseFloat(e.target.value) || 0)} />
                      </td>
                      <td className="py-1.5 pr-2">
                        <Input type="number" min={0} max={100} value={item.discount} onChange={(e) => updateItem(idx, "discount", parseFloat(e.target.value) || 0)} />
                      </td>
                      <td className="py-1.5 text-right font-medium text-slate-700">
                        ${item.line_total.toFixed(2)}
                      </td>
                      <td className="py-1.5 pl-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => removeItem(idx)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button variant="outline" size="sm" onClick={addItem} className="gap-1">
              <Plus className="h-3.5 w-3.5" /> Add Item
            </Button>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discounts</span>
                  <span>-${discountTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">{form.tax_exempt ? "Tax (Exempt)" : `Tax (${form.tax_rate}%)`}</span>
                <span className="font-medium">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Shipping</span>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.shipping}
                  onChange={(e) => set("shipping", parseFloat(e.target.value) || 0)}
                  className="w-24 h-7 text-right"
                />
              </div>
              <div className="flex justify-between border-t pt-2 font-bold text-base">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Payment terms, special instructions..." />
          </div>

          {/* Legal Footer */}
          <div>
            <Label>Legal Footer Statement</Label>
            <Textarea value={form.legal_footer} onChange={(e) => set("legal_footer", e.target.value)} rows={3} placeholder="Legal statement printed at the bottom of the invoice..." />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? "Saving..." : invoice ? "Update Invoice" : "Create Invoice"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}