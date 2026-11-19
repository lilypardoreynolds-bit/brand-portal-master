import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppSettings } from "@/lib/appSettings";

const DEFAULT = {
  product_id: "", product_name: "", supplier_id: "", supplier_name: "",
  sku: "", measurements: "", barcode: "", notes: "",
  on_hand: 0, current_stock: 0, min_stock_level: 0, max_stock_level: 0,
  warehouse: "Own Warehouse", warehouse_location: "", unit_cost: 0,
  last_updated: new Date().toISOString().split("T")[0]
};

export default function InventoryFormDialog({ open, onClose, item, onSave, products = [], suppliers = [] }) {
  const [form, setForm] = useState(DEFAULT);
  const [saving, setSaving] = useState(false);
  const { warehouses } = useAppSettings();

  useEffect(() => {
    setForm(item ? { ...DEFAULT, ...item } : DEFAULT);
  }, [item, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleProductChange = (productId) => {
    const product = products.find(p => p.id === productId);
    set("product_id", productId);
    set("product_name", product?.name || "");
    set("sku", product?.sku || "");
    if (!item) {
      // Inventory value should use cost, not selling price
      set("unit_cost", (product?.manufacturing_cost || 0) + (product?.packaging_cost || 0) + (product?.shipping_cost || 0) + (product?.import_duties_cost || 0));
    }
  };

  const handleSupplierChange = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    set("supplier_id", supplierId === "none" ? "" : supplierId);
    set("supplier_name", supplier?.supplier_name || "");
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...form, last_updated: new Date().toISOString().split("T")[0] });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Inventory Item" : "Add Product to Inventory"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">

          {/* Product Name */}
          <div>
            <Label>Product Name *</Label>
            {!item && products.length > 0 ? (
              <Select value={form.product_id || "none"} onValueChange={v => handleProductChange(v === "none" ? "" : v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select product..." /></SelectTrigger>
                <SelectContent>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={form.product_name}
                onChange={e => set("product_name", e.target.value)}
                className="mt-1"
                placeholder="Enter product name..."
                disabled={!!item}
              />
            )}
          </div>

          {/* Supplier */}
          <div>
            <Label>Supplier</Label>
            <Select value={form.supplier_id || "none"} onValueChange={handleSupplierChange}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select supplier..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.supplier_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Measurements & Barcode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Measurements <span className="text-slate-400 text-xs">(optional)</span></Label>
              <Input value={form.measurements} onChange={e => set("measurements", e.target.value)} className="mt-1" placeholder="e.g. 10x5x3 cm" />
            </div>
            <div>
              <Label>Barcode <span className="text-slate-400 text-xs">(optional)</span></Label>
              <Input value={form.barcode} onChange={e => set("barcode", e.target.value)} className="mt-1" placeholder="UPC / EAN..." />
            </div>
          </div>

          {/* Stock levels */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>On Hand</Label>
              <Input type="number" min="0" value={form.on_hand} onChange={e => set("on_hand", Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <Label>Min Stock</Label>
              <Input type="number" min="0" value={form.min_stock_level} onChange={e => set("min_stock_level", Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <Label>Max Stock</Label>
              <Input type="number" min="0" value={form.max_stock_level} onChange={e => set("max_stock_level", Number(e.target.value))} className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Unit Cost ($)</Label>
              <Input type="number" min="0" step="0.01" value={form.unit_cost} onChange={e => set("unit_cost", Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <Label>Warehouse</Label>
              <Select value={form.warehouse || "Own Warehouse"} onValueChange={v => set("warehouse", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select warehouse..." /></SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input value={form.warehouse_location || ""} onChange={e => set("warehouse_location", e.target.value)} placeholder="Bin / shelf (optional)" className="mt-2" />
            </div>
          </div>

          {form.unit_cost > 0 && form.on_hand > 0 && (
            <div className="bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-600">
              Inventory Value: <strong className="text-slate-800">${(form.on_hand * form.unit_cost).toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label>Notes <span className="text-slate-400 text-xs">(optional)</span></Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} className="mt-1" placeholder="Any additional notes..." />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.product_name} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}