import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { Paperclip, X, Loader2 } from "lucide-react";
import { useAppSettings } from "@/lib/appSettings";

const DEFAULT = {
  date: new Date().toISOString().split("T")[0],
  product_id: "", product_name: "", inventory_id: "",
  movement_type: "Inbound", quantity: 1, label: "", label_file_url: "", reference: "", notes: "", location: ""
};

const TYPE_DESCRIPTIONS = {
  Inbound: "Increases stock (received from supplier, returned items, etc.)",
  Outbound: "Decreases stock (sold, shipped, consumed, etc.)",
  Adjustment: "Manual correction to set exact stock level"
};

export default function MovementFormDialog({ open, onClose, onSave, inventory = [], defaultInventoryId = null, products = [] }) {
  const [form, setForm] = useState(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { warehouses } = useAppSettings();

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("label_file_url", file_url);
    setUploading(false);
  };

  useEffect(() => {
    if (open) {
      const preset = defaultInventoryId ? inventory.find(i => i.id === defaultInventoryId) : null;
      setForm({
        ...DEFAULT,
        inventory_id: defaultInventoryId || "",
        product_id: preset?.product_id || "",
        product_name: preset?.product_name || "",
      });
    }
  }, [open, defaultInventoryId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleInventoryChange = (invId) => {
    const inv = inventory.find(i => i.id === invId);
    set("inventory_id", invId);
    set("product_id", inv?.product_id || "");
    set("product_name", inv?.product_name || "");
    set("location", inv?.warehouse_location || "");
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  const currentItem = inventory.find(i => i.id === form.inventory_id);
  const previewStock = currentItem ? (() => {
    const q = Number(form.quantity) || 0;
    const onHand = currentItem.on_hand ?? currentItem.current_stock ?? 0;
    if (form.movement_type === "Inbound") return onHand + q;
    if (form.movement_type === "Outbound") return onHand - q;
    return q; // Adjustment sets exact value
  })() : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Inventory Movement</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Product *</Label>
            {inventory.length > 0 ? (
              <Select value={form.inventory_id || "none"} onValueChange={v => handleInventoryChange(v === "none" ? "" : v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select product..." /></SelectTrigger>
                <SelectContent>
                  {inventory.map(i => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.product_name} (On Hand: {i.on_hand ?? i.current_stock ?? 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select value={form.product_id || "none"} onValueChange={v => {
                if (v === "none") { set("product_id", ""); set("product_name", ""); return; }
                const p = products.find(p => p.id === v);
                if (p) { set("product_id", p.id); set("product_name", p.name); }
              }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select product..." /></SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label>Movement Type</Label>
            <Select value={form.movement_type} onValueChange={v => set("movement_type", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Inbound">📥 Inbound (Add Stock)</SelectItem>
                <SelectItem value="Outbound">📤 Outbound (Remove Stock)</SelectItem>
                <SelectItem value="Adjustment">🔧 Adjustment (Set Exact)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-400 mt-1">{TYPE_DESCRIPTIONS[form.movement_type]}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{form.movement_type === "Adjustment" ? "New Stock Level" : "Quantity"}</Label>
              <Input type="number" min="0" value={form.quantity} onChange={e => set("quantity", Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="mt-1" />
            </div>
          </div>

          <div>
            <Label>Location</Label>
            <Select value={form.location || "none"} onValueChange={v => set("location", v === "none" ? "" : v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select location..." /></SelectTrigger>
              <SelectContent>
                {warehouses.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {previewStock !== null && currentItem && (
            <div className={`rounded-lg px-3 py-2 text-sm ${previewStock < 0 ? "bg-red-50 text-red-700 border border-red-200" : "bg-slate-50 text-slate-600"}`}>
              Stock after movement: <strong>{currentItem.on_hand ?? currentItem.current_stock ?? 0}</strong> → <strong>{previewStock}</strong>
              {previewStock < 0 && " ⚠️ Stock will go negative"}
            </div>
          )}

          {form.movement_type === "Outbound" && (
            <div className="space-y-2">
              <Label>Label</Label>
              <Input value={form.label} onChange={e => set("label", e.target.value)} className="mt-1" placeholder="e.g. Amazon, Shopify, Wholesale, Sample..." />
              <div className="flex items-center gap-2 mt-1">
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                {!form.label_file_url ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current.click()} disabled={uploading} className="text-xs gap-1.5">
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
                    {uploading ? "Uploading..." : "Attach File"}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 bg-slate-50 border rounded-md px-3 py-1.5 text-xs text-slate-700 w-full">
                    <Paperclip className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    <a href={form.label_file_url} target="_blank" rel="noreferrer" className="truncate flex-1 text-indigo-600 hover:underline">View attached file</a>
                    <button type="button" onClick={() => set("label_file_url", "")} className="text-slate-400 hover:text-red-500">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <Label>Reference</Label>
            <Input value={form.reference} onChange={e => set("reference", e.target.value)} className="mt-1" placeholder="Order #, Supplier, PO number..." />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} className="mt-1" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || (!form.inventory_id && !form.product_id) || !form.quantity} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? "Saving..." : "Record Movement"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}