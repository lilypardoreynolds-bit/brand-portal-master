import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PackageX, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { computeLandedCostBreakdown, poToLedgerTransactions, costCenterToLedgerTransactions } from "@/lib/ledgerCalc";

const REASONS = [
  "Marketing Sample", "Influencer Campaign", "Product Giveaway",
  "Internal Use", "Damaged", "Expired", "Donation",
  "Quality Testing", "Return to Supplier", "Inventory Adjustment",
];

const DEPARTMENTS = ["Marketing", "Sales", "Operations", "Inventory", "Finance", "Product", "Brand", "Other"];

function fmtMoney(n) {
  return "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ConsumptionFormDialog({ open, onClose, onConfirm, inventory, saving }) {
  const [form, setForm] = useState({
    inventory_id: "",
    quantity: "",
    date: new Date().toISOString().split("T")[0],
    reason: "Internal Use",
    department: "Operations",
    related_campaign: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        inventory_id: "",
        quantity: "",
        date: new Date().toISOString().split("T")[0],
        reason: "Internal Use",
        department: "Operations",
        related_campaign: "",
        notes: "",
      });
    }
  }, [open]);

  const selectedItem = inventory.find(i => i.id === form.inventory_id);

  const { data: ledgerTxns = [] } = useQuery({
    queryKey: ["ledger_transactions"],
    queryFn: () => base44.entities.LedgerTransaction.list(),
    initialData: [],
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ["purchase_orders"],
    queryFn: () => base44.entities.PurchaseOrder.list(),
    initialData: [],
  });

  const { data: costCenters = [] } = useQuery({
    queryKey: ["cost_centers"],
    queryFn: () => base44.entities.CostCenter.list(),
    initialData: [],
  });

  const landedUnitCost = useMemo(() => {
    if (!selectedItem?.product_id) return 0;
    const pid = selectedItem.product_id;
    const poTxns = poToLedgerTransactions(purchaseOrders, pid);
    const ccTxns = costCenterToLedgerTransactions(costCenters.filter(c => c.product_id === pid));
    const manualTxns = ledgerTxns.filter(t => t.product_id === pid);
    const all = [...manualTxns, ...poTxns, ...ccTxns];
    return computeLandedCostBreakdown(all, pid).landedUnitCost;
  }, [selectedItem, ledgerTxns, purchaseOrders, costCenters]);

  const qty = Number(form.quantity) || 0;
  const maxQty = selectedItem ? (selectedItem.on_hand ?? 0) : 0;
  const totalValue = qty * landedUnitCost;
  const isValid = form.inventory_id && qty > 0 && qty <= maxQty;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const stockItems = inventory.filter(i => (i.on_hand ?? 0) > 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageX className="h-5 w-5 text-amber-500" />
            Record Inventory Consumption
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            Consume inventory for operational purposes. Stock will be reduced and an expense will be auto-created in the General Ledger using the current landed unit cost.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div>
            <Label>Product *</Label>
            <Select value={form.inventory_id} onValueChange={v => set("inventory_id", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select product..." /></SelectTrigger>
              <SelectContent>
                {stockItems.map(i => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.product_name} — {i.warehouse || "Own Warehouse"} ({i.on_hand ?? 0} on hand)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantity *</Label>
              <Input type="number" min={1} max={maxQty} value={form.quantity} onChange={e => set("quantity", e.target.value)} placeholder="0" className="mt-1" />
              {selectedItem && <p className="text-xs text-slate-400 mt-1">Max: {maxQty} on hand</p>}
              {qty > maxQty && <p className="text-xs text-red-600 mt-1">⚠ Exceeds on hand ({maxQty})</p>}
            </div>
            <div>
              <Label>Date *</Label>
              <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Reason *</Label>
              <Select value={form.reason} onValueChange={v => set("reason", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Department *</Label>
              <Select value={form.department} onValueChange={v => set("department", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Related Campaign <span className="text-slate-400 text-xs">(optional)</span></Label>
            <Input value={form.related_campaign} onChange={e => set("related_campaign", e.target.value)} placeholder="e.g. Summer Influencer Campaign" className="mt-1" />
          </div>

          {selectedItem && landedUnitCost > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Landed Unit Cost:</span>
                <strong className="text-slate-900">{fmtMoney(landedUnitCost)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Quantity:</span>
                <strong className="text-slate-900">{qty}</strong>
              </div>
              <div className="flex justify-between border-t border-amber-200 pt-1">
                <span className="text-amber-800 font-medium">Total Expense Value:</span>
                <strong className="text-amber-800">{fmtMoney(totalValue)}</strong>
              </div>
            </div>
          )}

          <div>
            <Label>Notes <span className="text-slate-400 text-xs">(optional)</span></Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} className="mt-1" placeholder="Additional details..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            disabled={!isValid || saving}
            onClick={() => onConfirm({
              inventory_id: selectedItem.id,
              product_id: selectedItem.product_id,
              product_name: selectedItem.product_name,
              sku: selectedItem.sku || "",
              warehouse: selectedItem.warehouse || "Own Warehouse",
              quantity: qty,
              date: form.date,
              reason: form.reason,
              department: form.department,
              related_campaign: form.related_campaign || "",
              landed_unit_cost: landedUnitCost,
              total_value: totalValue,
              notes: form.notes || "",
            })}
            className="bg-amber-600 hover:bg-amber-700 gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageX className="h-4 w-4" />}
            {saving ? "Processing..." : "Record Consumption"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}