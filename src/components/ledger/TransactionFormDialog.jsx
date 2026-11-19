import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { TX_TYPE_LABELS } from "@/lib/ledgerCalc";

const TODAY = new Date().toISOString().split("T")[0];

export default function TransactionFormDialog({ open, onClose, onSubmit, editing, products, categories, defaultProductId, currentUser }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    date: TODAY,
    transaction_type: "investment",
    category: "",
    counterparty: "",
    counterparty_type: "supplier",
    description: "",
    reference_number: "",
    quantity: 0,
    unit_cost: 0,
    amount_in: 0,
    amount_out: 0,
    product_id: "",
    notes: "",
    attachment_urls: [],
  });
  const [allocations, setAllocations] = useState([]);
  const [enableSplit, setEnableSplit] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        date: editing.date || TODAY,
        transaction_type: editing.transaction_type || "investment",
        category: editing.category || "",
        counterparty: editing.counterparty || "",
        counterparty_type: editing.counterparty_type || "supplier",
        description: editing.description || "",
        reference_number: editing.reference_number || "",
        quantity: editing.quantity || 0,
        unit_cost: editing.unit_cost || 0,
        amount_in: editing.amount_in || 0,
        amount_out: editing.amount_out || 0,
        product_id: editing.product_id || "",
        notes: editing.notes || "",
        attachment_urls: editing.attachment_urls || [],
      });
      setAllocations(editing.allocations || []);
      setEnableSplit((editing.allocations || []).length > 0);
    } else {
      setForm((f) => ({
        ...f,
        date: TODAY,
        product_id: defaultProductId || "",
        transaction_type: "investment",
        category: "",
        counterparty: "",
        description: "",
        reference_number: "",
        quantity: 0,
        unit_cost: 0,
        amount_in: 0,
        amount_out: 0,
        notes: "",
        attachment_urls: [],
      }));
      setAllocations([]);
      setEnableSplit(false);
    }
  }, [editing, open, defaultProductId]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Auto-set amount_out / amount_in based on type
  useEffect(() => {
    if (form.transaction_type === "investment" || form.transaction_type === "expense") {
      if (form.amount_in !== 0) set("amount_in", 0);
    } else if (form.transaction_type === "revenue") {
      if (form.amount_out !== 0) set("amount_out", 0);
    }
  }, [form.transaction_type]);

  const totalAmount = Number(form.amount_in) + Number(form.amount_out);
  const allocTotal = allocations.reduce((s, a) => s + (Number(a.amount) || 0), 0);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map((file) => base44.integrations.Core.UploadFile({ file }))
      );
      set("attachment_urls", [...form.attachment_urls, ...uploaded.map((r) => r.file_url)]);
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const addAllocation = () => {
    setAllocations((a) => [...a, { product_id: "", product_name: "", sku: "", brand: "", client: "", supplier: "", purchase_order: "", shipment: "", amount: 0, quantity: 0 }]);
  };
  const updateAlloc = (i, k, v) => {
    setAllocations((arr) => arr.map((a, idx) => (idx === i ? { ...a, [k]: v } : a)));
  };
  const removeAlloc = (i) => setAllocations((arr) => arr.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!form.date || !form.category) {
      toast({ title: "Date and category are required", variant: "destructive" });
      return;
    }
    if (enableSplit && allocTotal !== totalAmount && totalAmount > 0) {
      toast({ title: `Allocation total ($${allocTotal.toFixed(2)}) must equal transaction amount ($${totalAmount.toFixed(2)})`, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const product = products.find((p) => p.id === form.product_id);
      const payload = {
        ...form,
        product_name: product?.name || "",
        sku: product?.sku || "",
        quantity: Number(form.quantity) || 0,
        unit_cost: Number(form.unit_cost) || 0,
        amount_in: Number(form.amount_in) || 0,
        amount_out: Number(form.amount_out) || 0,
        allocations: enableSplit ? allocations.map((a) => {
          const p = products.find((pp) => pp.id === a.product_id);
          return { ...a, product_name: p?.name || "", sku: p?.sku || "", amount: Number(a.amount) || 0, quantity: Number(a.quantity) || 0 };
        }) : [],
        created_by_name: currentUser?.full_name || "",
        edited_by_name: currentUser?.full_name || "",
      };
      await onSubmit(payload);
    } catch (err) {
      toast({ title: "Failed to save transaction", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
      onClose();
    }
  };

  const filteredCats = categories.filter((c) => c.type === form.transaction_type);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Date *</Label>
              <Input type="date" className="h-9" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Type *</Label>
              <Select value={form.transaction_type} onValueChange={(v) => set("transaction_type", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TX_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Category *</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {filteredCats.map((c) => (
                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Counterparty</Label>
              <Input className="h-9" placeholder="Supplier or customer" value={form.counterparty} onChange={(e) => set("counterparty", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Counterparty Type</Label>
              <Select value={form.counterparty_type} onValueChange={(v) => set("counterparty_type", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="supplier">Supplier</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Description</Label>
            <Textarea className="text-sm" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Reference #</Label>
              <Input className="h-9" value={form.reference_number} onChange={(e) => set("reference_number", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Quantity</Label>
              <Input type="number" className="h-9" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Unit Cost</Label>
              <Input type="number" className="h-9" value={form.unit_cost} onChange={(e) => set("unit_cost", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">{form.transaction_type === "revenue" ? "Amount In (+)" : "Amount Out (-)"}</Label>
              <Input
                type="number"
                className="h-9"
                value={form.transaction_type === "revenue" ? form.amount_in : form.amount_out}
                onChange={(e) => form.transaction_type === "revenue" ? set("amount_in", e.target.value) : set("amount_out", e.target.value)}
              />
            </div>
          </div>

          {/* Attachments */}
          <div>
            <Label className="text-xs">Attachments</Label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={uploading} onClick={() => document.getElementById("ledger-file-upload").click()}>
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Upload
              </Button>
              <input id="ledger-file-upload" type="file" multiple className="hidden" onChange={handleUpload} />
              <span className="text-xs text-slate-400">{form.attachment_urls.length} file(s)</span>
            </div>
            {form.attachment_urls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.attachment_urls.map((url, i) => (
                  <div key={i} className="flex items-center gap-1 bg-slate-100 rounded px-2 py-1 text-xs">
                    <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate max-w-[150px]">{url.split("/").pop()}</a>
                    <button onClick={() => set("attachment_urls", form.attachment_urls.filter((_, idx) => idx !== i))} className="text-rose-500">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cost Allocation */}
          <div className="border-t pt-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={enableSplit} onChange={(e) => setEnableSplit(e.target.checked)} className="rounded" />
              Split cost across multiple products / brands / clients
            </label>
            {enableSplit && (
              <div className="mt-3 space-y-2">
                {allocations.map((a, i) => (
                  <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end bg-slate-50 p-2 rounded">
                    <div>
                      <Label className="text-[10px]">Product</Label>
                      <Select value={a.product_id} onValueChange={(v) => updateAlloc(i, "product_id", v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[10px]">Brand / Client</Label>
                      <Input className="h-8 text-xs" value={a.brand} onChange={(e) => updateAlloc(i, "brand", e.target.value)} placeholder="Brand" />
                    </div>
                    <div>
                      <Label className="text-[10px]">PO / Shipment</Label>
                      <Input className="h-8 text-xs" value={a.purchase_order} onChange={(e) => updateAlloc(i, "purchase_order", e.target.value)} placeholder="PO #" />
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1">
                        <Label className="text-[10px]">Amount</Label>
                        <Input type="number" className="h-8 text-xs" value={a.amount} onChange={(e) => updateAlloc(i, "amount", e.target.value)} />
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => removeAlloc(i)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addAllocation}>
                    <Plus className="h-3.5 w-3.5" /> Add allocation
                  </Button>
                  <span className={`text-xs font-semibold ${allocTotal === totalAmount ? "text-emerald-600" : "text-rose-600"}`}>
                    Allocated: ${allocTotal.toFixed(2)} / ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea className="text-sm" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] gap-1.5">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Update" : "Create"} Transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}