import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gift } from "lucide-react";
import { useAppSettings, MAIN_WAREHOUSE } from "@/lib/appSettings";

const PROGRAMS = ["Amazon Vine", "Samples", "Influencer", "Other"];
const STATUSES = ["Allocated", "Shipped", "Completed"];

const whOf = (i) => i.warehouse || MAIN_WAREHOUSE;
const availOf = (i) => {
  const onHand = i.on_hand ?? i.current_stock ?? 0;
  return Math.max(0, onHand - (i.reserved ?? 0));
};

export default function AllocationFormDialog({ open, onClose, onSave, inventory = [] }) {
  // Warehouses come from Brand Settings, plus any warehouse already used in inventory
  const { warehouses: settingsWarehouses } = useAppSettings();
  const warehouses = Array.from(new Set([...settingsWarehouses, ...inventory.map(whOf)]));
  const defaultWarehouse = warehouses.includes("Amazon FBA") ? "Amazon FBA" : warehouses[0] || MAIN_WAREHOUSE;

  const [warehouse, setWarehouse] = useState(defaultWarehouse);
  const [inventoryId, setInventoryId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [program, setProgram] = useState("Amazon Vine");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("Allocated");
  const [shippingCost, setShippingCost] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setWarehouse(defaultWarehouse);
      setInventoryId("");
      setQuantity("");
      setProgram("Amazon Vine");
      setDate(new Date().toISOString().split("T")[0]);
      setStatus("Allocated");
      setShippingCost("");
      setNotes("");
      setError("");
    }
  }, [open]);

  const rows = inventory.filter(i => whOf(i) === warehouse);
  const selected = rows.find(i => i.id === inventoryId);
  const maxQty = selected ? availOf(selected) : 0;
  const qty = Number(quantity) || 0;
  const unitCost = selected?.unit_cost || 0;
  const productCost = Math.round(qty * unitCost * 100) / 100;
  const shipping = Math.max(0, Number(shippingCost) || 0);
  const totalCost = Math.round((productCost + shipping) * 100) / 100;

  const handleSave = async () => {
    if (!selected) { setError("Select a product."); return; }
    if (qty <= 0) { setError("Quantity must be greater than 0."); return; }
    if (qty > maxQty) { setError(`Only ${maxQty} sellable units available in ${warehouse}.`); return; }
    setSaving(true);
    setError("");
    try {
      await onSave({ inventory_id: inventoryId, quantity: qty, program, date, status, shipping_cost: shipping, notes });
      setSaving(false);
      onClose();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not create the allocation.");
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-violet-500" /> New Marketing Allocation
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            Units are reserved out of sellable stock and booked as a Marketing expense. No sale or revenue is created.
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Warehouse *</Label>
              <Select value={warehouse} onValueChange={v => { setWarehouse(v); setInventoryId(""); }}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Program *</Label>
              <Select value={program} onValueChange={setProgram}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROGRAMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Product / Variant *</Label>
            <Select value={inventoryId} onValueChange={setInventoryId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select product..." /></SelectTrigger>
              <SelectContent>
                {rows.length === 0 && <SelectItem value="none" disabled>No stock in {warehouse}</SelectItem>}
                {rows.map(i => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.product_name} ({availOf(i)} sellable)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected && (
              <p className="text-xs text-slate-500 mt-1">
                On hand {selected.on_hand ?? 0} · Reserved {selected.reserved ?? 0} · Sellable {maxQty} · Unit cost ${unitCost.toFixed(5)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantity *</Label>
              <Input type="number" min="1" max={maxQty} value={quantity} onChange={e => setQuantity(e.target.value)} className="mt-1" placeholder="0" />
            </div>
            <div>
              <Label>Date *</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Shipping Cost (USD)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={shippingCost}
                onChange={e => setShippingCost(e.target.value)}
                className="mt-1"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="bg-violet-50 border border-violet-100 rounded-lg px-3 py-2 text-sm text-violet-800 space-y-1">
            <div className="flex items-center justify-between">
              <span>Product cost <span className="text-violet-500 text-xs">({qty || 0} × ${unitCost.toFixed(5)})</span></span>
              <strong>${productCost.toFixed(2)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Shipping cost</span>
              <strong>${shipping.toFixed(2)}</strong>
            </div>
            <div className="flex items-center justify-between border-t border-violet-200 pt-1">
              <span>Total cost</span>
              <strong>${totalCost.toFixed(2)}</strong>
            </div>
          </div>

          <div>
            <Label>Notes <span className="text-slate-400 text-xs">(optional)</span></Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="mt-1" placeholder="Campaign, reviewer list, tracking..." />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !selected || qty <= 0} className="bg-violet-600 hover:bg-violet-700">
            {saving ? "Creating..." : "Create Allocation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
