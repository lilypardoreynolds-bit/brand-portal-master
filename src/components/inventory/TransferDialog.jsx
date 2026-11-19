import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Warehouse, DollarSign, Plus, Trash2 } from "lucide-react";

const DEFAULT_WAREHOUSES = ["Own Warehouse", "Amazon FBA", "Other"];

export default function TransferDialog({ open, onClose, onConfirm, inventory, saving, warehouses = DEFAULT_WAREHOUSES }) {
  const WAREHOUSES = warehouses;
  const firstDestination = WAREHOUSES.find(w => w !== "Own Warehouse") || "Other";
  const [items, setItems] = useState([]);
  const [toWarehouse, setToWarehouse] = useState(firstDestination);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setItems([{ product_id: "", quantity: "" }]);
      setToWarehouse(firstDestination);
      setReference("");
      setNotes("");
    }
  }, [open]);

  // Only show items from Own Warehouse (source)
  const sourceItems = inventory.filter(i => i.warehouse === "Own Warehouse" || !i.warehouse);

  const addItem = () => setItems([...items, { product_id: "", quantity: "" }]);
  
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));
  
  const updateItem = (idx, field, value) => {
    const newItems = [...items];
    newItems[idx][field] = value;
    setItems(newItems);
  };

  const validItems = items.filter(item => {
    const selected = sourceItems.find(i => i.id === item.product_id);
    const qty = Number(item.quantity) || 0;
    const maxQty = selected ? (selected.on_hand ?? 0) : 0;
    return item.product_id && qty > 0 && qty <= maxQty;
  });

  const canSubmit = validItems.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-orange-500" />
            Transfer to Warehouse
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">Move multiple products from Own Warehouse to Amazon FBA or another location.</p>
        </DialogHeader>

        <div className="space-y-4 py-1">

          {/* Destination */}
          <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
            <div>
              <p className="text-xs text-slate-500 font-medium">FROM</p>
              <p className="text-sm font-bold text-slate-800">Own Warehouse</p>
            </div>
            <ArrowRight className="h-5 w-5 text-orange-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500 font-medium">TO</p>
              <Select value={toWarehouse} onValueChange={setToWarehouse}>
                <SelectTrigger className="h-8 text-sm font-bold border-orange-200 bg-orange-50 text-orange-800 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WAREHOUSES.filter(w => w !== "Own Warehouse").map(w => (
                    <SelectItem key={w} value={w}>{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Products to Transfer</Label>
              <Button size="sm" variant="outline" onClick={addItem} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Product
              </Button>
            </div>

            {items.map((item, idx) => {
              const selected = sourceItems.find(i => i.id === item.product_id);
              const maxQty = selected ? (selected.on_hand ?? 0) : 0;
              const qty = Number(item.quantity) || 0;
              const isValid = item.product_id && qty > 0 && qty <= maxQty;

              return (
                <div key={idx} className="border rounded-lg p-3 space-y-2">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label className="text-xs">Product</Label>
                      <Select value={item.product_id} onValueChange={v => updateItem(idx, "product_id", v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {sourceItems.map(i => (
                            <SelectItem key={i.id} value={i.id}>
                              {i.product_name} ({i.on_hand ?? 0} on hand)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-32">
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        min={1}
                        max={maxQty}
                        value={item.quantity}
                        onChange={e => updateItem(idx, "quantity", e.target.value)}
                        placeholder="0"
                        className="h-8 text-sm"
                      />
                    </div>
                    {items.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem(idx)}
                        className="text-red-600 hover:bg-red-50 h-8 mt-6"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  {selected && (
                    <p className="text-xs text-slate-500">
                      On hand: <strong>{selected.on_hand ?? 0}</strong> · Reserved: <strong>{selected.reserved ?? 0}</strong> · Transferable: <strong>{maxQty}</strong>
                    </p>
                  )}
                  {qty > maxQty && maxQty >= 0 && (
                    <p className="text-xs text-red-600">⚠ Exceeds available stock ({maxQty})</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reference / Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Reference (optional)</Label>
              <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. Shipment #123" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Notes (optional)</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes..." />
            </div>
          </div>

          {/* Summary */}
          {canSubmit && (
            <div className="rounded-lg bg-orange-50 border border-orange-100 p-3 text-sm space-y-1">
              <p className="font-semibold text-orange-800">Transfer Summary</p>
              {validItems.map(item => {
                const selected = sourceItems.find(i => i.id === item.product_id);
                return (
                  <p key={item.product_id} className="text-orange-700">
                    {item.quantity} units of <strong>{selected?.product_name}</strong>
                  </p>
                );
              })}
              <p className="text-orange-700 mt-2">Destination: <strong>{toWarehouse}</strong></p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            disabled={!canSubmit || saving}
            onClick={() => onConfirm({ items: validItems, toWarehouse, reference, notes })}
            className="bg-orange-600 hover:bg-orange-700 gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            {saving ? "Transferring..." : "Confirm Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}