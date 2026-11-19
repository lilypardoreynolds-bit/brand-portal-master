import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import FileUploader from "@/components/shared/FileUploader";

const blankLine = () => ({ product_id: "", product_name: "", quantity: "", unit_price: "" });

const blank = () => ({
  po_number: `PO-${Date.now().toString().slice(-6)}`,
  order_date: format(new Date(), "yyyy-MM-dd"),
  expected_delivery: "",
  supplier_id: "",
  supplier_name: "",
  shipping_cost: "",
  import_duties: "",
  other_fees: "",
  packaging_cost: "",
  inspection_cost: "",
  prep_handling_cost: "",
  status: "Draft",
  payment_date: "",
  tracking_number: "",
  carrier: "",
  notes: "",
});

const blankInvoice = () => ({
  invoice_number: `INV-${Date.now().toString().slice(-6)}`,
  invoice_date: format(new Date(), "yyyy-MM-dd"),
  due_date: "",
  tax: "",
  payment_status: "Unpaid",
  file_url: "",
  notes: "",
});

const num = (v) => parseFloat(v) || 0;

export default function PurchaseOrderFormDialog({ open, onClose, onSave, po, products, suppliers }) {
  const [form, setForm] = useState(blank());
  const [lineItems, setLineItems] = useState([blankLine()]);
  const [attachInvoice, setAttachInvoice] = useState(false);
  const [invoice, setInvoice] = useState(blankInvoice());

  useEffect(() => {
    if (!open) return;
    if (po) {
      setForm({
        ...blank(),
        ...po,
        shipping_cost: po.shipping_cost?.toString() || "",
        import_duties: po.import_duties?.toString() || "",
        other_fees: po.other_fees?.toString() || "",
        packaging_cost: po.packaging_cost?.toString() || "",
        inspection_cost: po.inspection_cost?.toString() || "",
        prep_handling_cost: po.prep_handling_cost?.toString() || "",
      });
      // Load existing line items, or build one from legacy single-product fields
      if (po.line_items && po.line_items.length > 0) {
        setLineItems(po.line_items.map(li => ({
          ...li,
          quantity: li.quantity?.toString() || "",
          unit_price: li.unit_price?.toString() || "",
        })));
      } else {
        setLineItems([{
          product_id: po.product_id || "",
          product_name: po.product_name || "",
          quantity: po.quantity?.toString() || "",
          unit_price: po.unit_price?.toString() || "",
        }]);
      }
    } else {
      setForm(blank());
      setLineItems([blankLine()]);
    }
    setAttachInvoice(false);
    setInvoice(blankInvoice());
  }, [open, po]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setInv = (k, v) => setInvoice(i => ({ ...i, [k]: v }));

  const setLine = (idx, k, v) => {
    setLineItems(items => items.map((item, i) => i === idx ? { ...item, [k]: v } : item));
  };

  const handleProductChange = (idx, productId) => {
    const p = products.find(p => p.id === productId);
    setLineItems(items => items.map((item, i) => i === idx
      ? { ...item, product_id: productId, product_name: p?.name || "" }
      : item
    ));
  };

  const addLine = () => setLineItems(items => [...items, blankLine()]);
  const removeLine = (idx) => setLineItems(items => items.filter((_, i) => i !== idx));

  const handleSupplierChange = (supplierId) => {
    const s = suppliers.find(s => s.id === supplierId);
    set("supplier_id", supplierId);
    set("supplier_name", s?.supplier_name || "");
  };

  const itemsSubtotal = lineItems.reduce((sum, li) => sum + num(li.quantity) * num(li.unit_price), 0);
  const total = itemsSubtotal + num(form.shipping_cost) + num(form.import_duties) + num(form.other_fees) + num(form.packaging_cost) + num(form.inspection_cost) + num(form.prep_handling_cost);
  const invoiceTotal = total + num(invoice.tax);

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedLines = lineItems
      .filter(li => li.product_name || li.product_id)
      .map(li => ({
        product_id: li.product_id,
        product_name: li.product_name,
        quantity: num(li.quantity),
        unit_price: num(li.unit_price),
      }));

    // Keep backward-compat fields from first line
    const firstLine = parsedLines[0] || {};
    const totalQty = parsedLines.reduce((s, li) => s + li.quantity, 0);
    const productNames = parsedLines.map(li => li.product_name).filter(Boolean).join(", ");

    const poData = {
      ...form,
      line_items: parsedLines,
      product_id: firstLine.product_id || "",
      product_name: productNames,
      quantity: totalQty,
      unit_price: firstLine.unit_price || 0,
      shipping_cost: num(form.shipping_cost),
      import_duties: num(form.import_duties),
      other_fees: num(form.other_fees),
      packaging_cost: num(form.packaging_cost),
      inspection_cost: num(form.inspection_cost),
      prep_handling_cost: num(form.prep_handling_cost),
      total_amount: total,
    };

    const invoiceData = attachInvoice && !po ? {
      ...invoice,
      supplier_name: form.supplier_name,
      po_number: form.po_number,
      subtotal: total,
      tax: num(invoice.tax),
      total_amount: invoiceTotal,
    } : null;

    onSave(poData, invoiceData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{po ? "Edit Purchase Order" : "New Purchase Order"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-1">

          {/* PO Info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>PO Number</Label>
              <Input value={form.po_number} onChange={e => set("po_number", e.target.value)} placeholder="PO-001" />
            </div>
            <div className="space-y-1.5">
              <Label>Order Date *</Label>
              <Input type="date" value={form.order_date} onChange={e => set("order_date", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Expected Delivery</Label>
              <Input type="date" value={form.expected_delivery} onChange={e => set("expected_delivery", e.target.value)} />
            </div>
          </div>

          {/* Supplier */}
          <div className="space-y-1.5">
            <Label>Manufacturer / Supplier</Label>
            {suppliers.length > 0 ? (
              <Select value={form.supplier_id} onValueChange={handleSupplierChange}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.supplier_name}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input value={form.supplier_name} onChange={e => set("supplier_name", e.target.value)} placeholder="Supplier name" />
            )}
            {form.supplier_id && (
              <Input className="mt-1" value={form.supplier_name} onChange={e => set("supplier_name", e.target.value)} placeholder="Supplier name" />
            )}
          </div>

          {/* Line Items */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Products</p>
              <Button type="button" variant="outline" size="sm" onClick={addLine} className="h-7 text-xs gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Product
              </Button>
            </div>

            {/* Header */}
            <div className="grid grid-cols-[1fr_80px_90px_32px] gap-2 text-xs font-semibold text-slate-400 uppercase px-1">
              <span>Product</span>
              <span>Qty</span>
              <span>Unit Price</span>
              <span></span>
            </div>

            {lineItems.map((li, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_80px_90px_32px] gap-2 items-center">
                <div>
                  {products.length > 0 ? (
                    <Select value={li.product_id || "none"} onValueChange={v => handleProductChange(idx, v === "none" ? "" : v)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input className="h-8 text-sm" value={li.product_name} onChange={e => setLine(idx, "product_name", e.target.value)} placeholder="Product name" />
                  )}
                </div>
                <Input className="h-8 text-sm" type="number" min="1" value={li.quantity} onChange={e => setLine(idx, "quantity", e.target.value)} placeholder="0" />
                <Input className="h-8 text-sm" type="number" step="0.01" min="0" value={li.unit_price} onChange={e => setLine(idx, "unit_price", e.target.value)} placeholder="0.00" />
                <Button
                  type="button" variant="ghost" size="icon"
                  className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => removeLine(idx)}
                  disabled={lineItems.length === 1}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}

            {/* Subtotal row */}
            <div className="flex justify-end pt-1 border-t border-slate-200 text-sm text-slate-500">
              Items subtotal: <span className="font-semibold text-slate-700 ml-1">${itemsSubtotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Shared Costs */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Shared Costs</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Shipping Cost ($)</Label>
                <Input type="number" step="0.01" min="0" value={form.shipping_cost} onChange={e => set("shipping_cost", e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label>Import / Duties ($)</Label>
                <Input type="number" step="0.01" min="0" value={form.import_duties} onChange={e => set("import_duties", e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label>Other Fees ($)</Label>
                <Input type="number" step="0.01" min="0" value={form.other_fees} onChange={e => set("other_fees", e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Packaging ($)</Label>
                <Input type="number" step="0.01" min="0" value={form.packaging_cost} onChange={e => set("packaging_cost", e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label>Inspection ($)</Label>
                <Input type="number" step="0.01" min="0" value={form.inspection_cost} onChange={e => set("inspection_cost", e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label>Prep / Handling ($)</Label>
                <Input type="number" step="0.01" min="0" value={form.prep_handling_cost} onChange={e => set("prep_handling_cost", e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2.5">
              <p className="text-xs text-indigo-500 font-medium">Total PO Amount</p>
              <p className="text-lg font-bold text-indigo-700">${total.toFixed(2)}</p>
            </div>
          </div>

          {/* Status & Tracking */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Draft", "Ordered", "Paid", "In Transit", "Delivered", "Cancelled"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Date</Label>
              <Input type="date" value={form.payment_date} onChange={e => set("payment_date", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tracking Number</Label>
              <Input value={form.tracking_number} onChange={e => set("tracking_number", e.target.value)} placeholder="e.g. 1Z999AA10123456784" />
            </div>
            <div className="space-y-1.5">
              <Label>Carrier</Label>
              <Input value={form.carrier} onChange={e => set("carrier", e.target.value)} placeholder="e.g. DHL, UPS, FedEx" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} placeholder="Any additional notes..." />
          </div>

          {/* Invoice Section — only on new POs */}
          {!po && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox id="attach-invoice" checked={attachInvoice} onCheckedChange={setAttachInvoice} />
                <Label htmlFor="attach-invoice" className="cursor-pointer font-semibold">Attach Supplier Invoice</Label>
              </div>
              {attachInvoice && (
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Invoice Number *</Label>
                      <Input value={invoice.invoice_number} onChange={e => setInv("invoice_number", e.target.value)} placeholder="INV-001" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Invoice Date *</Label>
                      <Input type="date" value={invoice.invoice_date} onChange={e => setInv("invoice_date", e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Due Date</Label>
                      <Input type="date" value={invoice.due_date} onChange={e => setInv("due_date", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tax ($)</Label>
                      <Input type="number" step="0.01" min="0" value={invoice.tax} onChange={e => setInv("tax", e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Payment Status</Label>
                      <Select value={invoice.payment_status} onValueChange={v => setInv("payment_status", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Unpaid", "Paid", "Partial", "Overdue"].map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5">
                        <p className="text-xs text-amber-600 font-medium">Invoice Total</p>
                        <p className="text-lg font-bold text-amber-700">${invoiceTotal.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Upload Invoice File</Label>
                    <FileUploader value={invoice.file_url} onChange={url => setInv("file_url", url)} accept="application/pdf,image/*" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Invoice Notes</Label>
                    <Textarea value={invoice.notes} onChange={e => setInv("notes", e.target.value)} rows={2} placeholder="Any invoice notes..." />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
              {po ? "Save Changes" : "Create PO"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}