import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { computeLandedCostBreakdown, poToLedgerTransactions, costCenterToLedgerTransactions } from "@/lib/ledgerCalc";
import { recordConsumption } from "@/lib/recordConsumption";
import { isViewerOnly } from "@/lib/permissions";

const SOURCES = ["Trybe", "TikTok Shop", "Instagram", "Manual", "Other"];
const today = () => new Date().toISOString().split("T")[0];
const money = (n) => "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const EMPTY = {
  date: today(),
  source_channel: "Trybe",
  inventory_id: "",
  quantity: "1",
  creator_name: "",
  creator_handle: "",
  related_campaign: "",
  order_reference: "",
  shipping_cost: "",
  tracking_number: "",
  notes: "",
};

/**
 * Simple one-page form to log creator samples (Trybe and similar).
 * A sample is NOT a sale: it leaves inventory and its product cost + shipping go to the ledger
 * as Marketing expenses.
 */
export default function SampleShipments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const readOnly = isViewerOnly(user);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const { data: inventory = [] } = useQuery({ queryKey: ["inventory"], queryFn: () => base44.entities.Inventory.list("product_name"), initialData: [] });
  const { data: ledgerTxns = [] } = useQuery({ queryKey: ["ledger_transactions"], queryFn: () => base44.entities.LedgerTransaction.list(), initialData: [] });
  const { data: purchaseOrders = [] } = useQuery({ queryKey: ["purchase_orders"], queryFn: () => base44.entities.PurchaseOrder.list(), initialData: [] });
  const { data: costCenters = [] } = useQuery({ queryKey: ["cost_centers"], queryFn: () => base44.entities.CostCenter.list(), initialData: [] });
  const { data: shipments = [] } = useQuery({
    queryKey: ["inventory_consumptions"],
    queryFn: () => base44.entities.InventoryConsumption.list("-date", 500),
    initialData: [],
  });

  const stockItems = inventory.filter((i) => (i.on_hand ?? 0) > 0);
  const item = inventory.find((i) => i.id === form.inventory_id);

  const landedUnitCost = useMemo(() => {
    if (!item?.product_id) return 0;
    const pid = item.product_id;
    const all = [
      ...ledgerTxns.filter((t) => t.product_id === pid),
      ...poToLedgerTransactions(purchaseOrders, pid),
      ...costCenterToLedgerTransactions(costCenters.filter((c) => c.product_id === pid)),
    ];
    const lc = computeLandedCostBreakdown(all, pid).landedUnitCost;
    return lc > 0 ? lc : item.unit_cost || 0;
  }, [item, ledgerTxns, purchaseOrders, costCenters]);

  const qty = Number(form.quantity) || 0;
  const productCost = qty * landedUnitCost;
  const shipping = Number(form.shipping_cost) || 0;
  const maxQty = item?.on_hand ?? 0;

  const duplicate = form.order_reference
    ? shipments.find((s) => (s.order_reference || "").trim().toLowerCase() === form.order_reference.trim().toLowerCase())
    : null;

  const errors = [];
  if (!form.inventory_id) errors.push("Choose the product");
  if (qty <= 0) errors.push("Quantity must be at least 1");
  if (item && qty > maxQty) errors.push(`Only ${maxQty} on hand in ${item.warehouse || "Own Warehouse"}`);
  if (!form.creator_name.trim()) errors.push("Enter the creator name");
  if (duplicate && !allowDuplicate) errors.push("This order number was already logged");

  const handleSave = async () => {
    if (errors.length || !item) return;
    setSaving(true);
    try {
      const res = await recordConsumption(
        {
          inventory_id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          sku: item.sku || "",
          quantity: qty,
          date: form.date,
          reason: "Influencer Campaign",
          department: "Marketing",
          related_campaign: form.related_campaign,
          landed_unit_cost: landedUnitCost,
          shipping_cost: shipping,
          source_channel: form.source_channel,
          creator_name: form.creator_name.trim(),
          creator_handle: form.creator_handle.trim(),
          order_reference: form.order_reference.trim(),
          tracking_number: form.tracking_number.trim(),
          notes: form.notes,
        },
        inventory,
        user
      );
      ["inventory", "inventory_movements", "inventory_consumptions", "ledger_transactions"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      setLastSaved({ ...res, product: item.product_name, creator: form.creator_name, qty });
      toast({ title: "Sample saved", description: `${qty} × ${item.product_name} to ${form.creator_name} — ${money(res.total)} in Marketing.` });
      setForm({ ...EMPTY, date: form.date, source_channel: form.source_channel, related_campaign: form.related_campaign });
      setAllowDuplicate(false);
    } catch (e) {
      toast({ title: "Could not save", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const samples = shipments.filter((s) => s.reason === "Influencer Campaign" || s.reason === "Marketing Sample" || s.source_channel === "Trybe");
  const monthKey = today().slice(0, 7);
  const thisMonth = samples.filter((s) => (s.date || "").startsWith(monthKey));
  const monthTotal = thisMonth.reduce((s, x) => s + (x.total_cost_with_shipping || (x.total_value || 0) + (x.shipping_cost || 0)), 0);
  const monthUnits = thisMonth.reduce((s, x) => s + (x.quantity || 0), 0);

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Truck className="h-6 w-6 text-[var(--brand)]" /> Sample Shipments</h1>
        <p className="text-sm text-slate-500 mt-1">
          Log every free sample sent to a creator (Trybe, TikTok, etc.). It is not a sale: the units leave inventory and the product cost + shipping are recorded as Marketing expenses.
        </p>
      </div>

      {lastSaved && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Saved: {lastSaved.qty} × {lastSaved.product} → {lastSaved.creator}</p>
            <p>Product cost {money(lastSaved.productCost)} + shipping {money(lastSaved.shipping)} = <strong>{money(lastSaved.total)}</strong> recorded in Marketing.</p>
          </div>
        </div>
      )}

      {!readOnly && (
        <Card className="border-slate-200">
          <CardHeader className="pb-2"><CardTitle className="text-base">New sample shipment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="date">Ship date</Label>
                <Input id="date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Select value={form.source_channel} onValueChange={(v) => set("source_channel", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Product</Label>
                <Select value={form.inventory_id} onValueChange={(v) => set("inventory_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select product..." /></SelectTrigger>
                  <SelectContent>
                    {stockItems.map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.product_name} — {i.warehouse || "Own Warehouse"} ({i.on_hand ?? 0} on hand)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qty">Quantity</Label>
                <Input id="qty" type="number" min={1} value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="creator">Creator name</Label>
                <Input id="creator" value={form.creator_name} onChange={(e) => set("creator_name", e.target.value)} placeholder="Full name as shown in Trybe" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="handle">Creator handle (optional)</Label>
                <Input id="handle" value={form.creator_handle} onChange={(e) => set("creator_handle", e.target.value)} placeholder="@handle" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="order">Shopify order number</Label>
                <Input id="order" value={form.order_reference} onChange={(e) => { set("order_reference", e.target.value); setAllowDuplicate(false); }} placeholder="#1234" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="campaign">Campaign (optional)</Label>
                <Input id="campaign" value={form.related_campaign} onChange={(e) => set("related_campaign", e.target.value)} placeholder="e.g. Black Friday creators" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ship">Shipping cost ($)</Label>
                <Input id="ship" type="number" min={0} step="0.01" value={form.shipping_cost} onChange={(e) => set("shipping_cost", e.target.value)} placeholder="Label cost" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="track">Tracking number (optional)</Label>
                <Input id="track" value={form.tracking_number} onChange={(e) => set("tracking_number", e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>

            {item && (
              <div className="rounded-lg bg-slate-50 border p-3 text-sm grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div><p className="text-xs text-slate-500">Unit cost</p><p className="font-semibold">{money(landedUnitCost)}</p></div>
                <div><p className="text-xs text-slate-500">Product cost</p><p className="font-semibold">{money(productCost)}</p></div>
                <div><p className="text-xs text-slate-500">Shipping</p><p className="font-semibold">{money(shipping)}</p></div>
                <div><p className="text-xs text-slate-500">Total to Marketing</p><p className="font-bold text-[var(--brand)]">{money(productCost + shipping)}</p></div>
              </div>
            )}

            {duplicate && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <div className="space-y-1">
                  <p>Order <strong>{form.order_reference}</strong> was already logged on {duplicate.date} ({duplicate.quantity} × {duplicate.product_name} to {duplicate.creator_name || "—"}).</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={allowDuplicate} onChange={(e) => setAllowDuplicate(e.target.checked)} />
                    This is a different shipment, save anyway
                  </label>
                </div>
              </div>
            )}

            {errors.length > 0 && (form.inventory_id || form.creator_name) && (
              <ul className="text-xs text-red-600 list-disc pl-5">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
            )}

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving || errors.length > 0} className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                {saving ? "Saving..." : "Save sample shipment"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-slate-200"><CardContent className="p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold">Samples this month</p>
          <p className="text-2xl font-bold text-slate-900">{monthUnits} units</p>
          <p className="text-xs text-slate-400">{thisMonth.length} shipment(s)</p>
        </CardContent></Card>
        <Card className="border-slate-200"><CardContent className="p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold">Marketing cost this month</p>
          <p className="text-2xl font-bold text-[var(--brand)]">{money(monthTotal)}</p>
          <p className="text-xs text-slate-400">product + shipping</p>
        </CardContent></Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-2"><CardTitle className="text-base">Recent sample shipments</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {samples.length === 0 ? (
            <p className="text-sm text-slate-400 p-6 text-center">No samples logged yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b text-xs uppercase text-slate-500">
                  <th className="text-left px-4 py-2">Date</th>
                  <th className="text-left px-4 py-2">Creator</th>
                  <th className="text-left px-4 py-2">Product</th>
                  <th className="text-right px-4 py-2">Qty</th>
                  <th className="text-left px-4 py-2">Order</th>
                  <th className="text-right px-4 py-2">Product $</th>
                  <th className="text-right px-4 py-2">Ship $</th>
                  <th className="text-right px-4 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {samples.slice(0, 50).map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="px-4 py-2 whitespace-nowrap text-slate-600">{s.date}</td>
                    <td className="px-4 py-2">{s.creator_name || "—"}{s.creator_handle ? <span className="text-slate-400 text-xs ml-1">{s.creator_handle}</span> : null}</td>
                    <td className="px-4 py-2">{s.product_name}</td>
                    <td className="px-4 py-2 text-right">{s.quantity}</td>
                    <td className="px-4 py-2 text-slate-500">{s.order_reference || "—"}</td>
                    <td className="px-4 py-2 text-right">{money(s.total_value)}</td>
                    <td className="px-4 py-2 text-right">{money(s.shipping_cost)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{money(s.total_cost_with_shipping || (s.total_value || 0) + (s.shipping_cost || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
