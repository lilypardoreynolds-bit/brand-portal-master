import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Trash2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const TODAY = new Date().toISOString().split("T")[0];

export default function CostCenterFormDialog({ open, onClose, onSubmit, editing, products, categories, defaultProductId, currentUser }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    date: TODAY,
    transaction_type: "investment",
    category: "",
    description: "",
    supplier: "",
    po_number: "",
    quantity: 0,
    unit_cost: 0,
    amount: 0,
    notes: "",
    attachment_urls: [],
  });

  useEffect(() => {
    if (editing) {
      setForm({
        date: editing.date || TODAY,
        transaction_type: editing.transaction_type || "investment",
        category: editing.category || "",
        description: editing.description || "",
        supplier: editing.supplier || "",
        po_number: editing.po_number || "",
        quantity: editing.quantity || 0,
        unit_cost: editing.unit_cost || 0,
        amount: editing.amount || 0,
        notes: editing.notes || "",
        attachment_urls: editing.attachment_urls || [],
      });
    } else {
      setForm({
        date: TODAY,
        transaction_type: "investment",
        category: "",
        description: "",
        supplier: "",
        po_number: "",
        quantity: 0,
        unit_cost: 0,
        amount: 0,
        notes: "",
        attachment_urls: [],
        product_id: defaultProductId || "",
      });
    }
  }, [editing, open, defaultProductId]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Auto-calculate amount from quantity * unit_cost
  useEffect(() => {
    const qty = Number(form.quantity) || 0;
    const uc = Number(form.unit_cost) || 0;
    if (qty > 0 && uc > 0) {
      set("amount", (qty * uc).toFixed(2));
    }
  }, [form.quantity, form.unit_cost]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map((file) => base44.integrations.Core.UploadFile({ file })));
      set("attachment_urls", [...form.attachment_urls, ...uploaded.map((r) => r.file_url)]);
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.date || !form.category) {
      toast({ title: "Date and category are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const product = products.find((p) => p.id === (form.product_id || defaultProductId));
      const payload = {
        ...form,
        product_id: form.product_id || defaultProductId,
        product_name: product?.name || "",
        sku: product?.sku || "",
        quantity: Number(form.quantity) || 0,
        unit_cost: Number(form.unit_cost) || 0,
        amount: Number(form.amount) || 0,
        created_by_name: currentUser?.full_name || "",
      };
      await onSubmit(payload);
    } catch (err) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
      onClose();
    }
  };

  const filteredCats = categories.filter((c) => c.type === form.transaction_type || c.type === "expense");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Cost Entry" : "Add Cost Entry"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Date *</Label>
              <Input type="date" className="h-9" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Type *</Label>
              <Select value={form.transaction_type} onValueChange={(v) => set("transaction_type", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Category *</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {filteredCats.map((c) => (
                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Description</Label>
            <Textarea className="text-sm" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Supplier</Label>
              <Input className="h-9" value={form.supplier} onChange={(e) => set("supplier", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">PO Number</Label>
              <Input className="h-9" value={form.po_number} onChange={(e) => set("po_number", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Quantity</Label>
              <Input type="number" className="h-9" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Unit Cost</Label>
              <Input type="number" className="h-9" value={form.unit_cost} onChange={(e) => set("unit_cost", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Amount</Label>
              <Input type="number" className="h-9" value={form.amount} onChange={(e) => set("amount", e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Attachments</Label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={uploading} onClick={() => document.getElementById("cc-file-upload").click()}>
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Upload
              </Button>
              <input id="cc-file-upload" type="file" multiple className="hidden" onChange={handleUpload} />
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

          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea className="text-sm" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-[#78AF86] hover:bg-[#5d8f6b] gap-1.5">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Update" : "Create"} Cost Entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}