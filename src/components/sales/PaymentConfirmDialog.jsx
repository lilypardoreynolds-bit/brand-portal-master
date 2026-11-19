import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle } from "lucide-react";

export default function PaymentConfirmDialog({ open, onClose, invoice, onConfirm }) {
  const [form, setForm] = useState({
    payment_date: new Date().toISOString().split("T")[0],
    payment_reference: "",
    payment_transaction_number: "",
    payment_method: "transfer",
  });
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    setSaving(true);
    await onConfirm({ ...form });
    setSaving(false);
    onClose();
    setForm({ payment_date: new Date().toISOString().split("T")[0], payment_reference: "", payment_transaction_number: "", payment_method: "transfer" });
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Confirm Payment — {invoice.invoice_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Amount summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-xs text-green-600 font-medium">Amount Received</p>
            <p className="text-2xl font-bold text-green-700">${(invoice.total_amount || 0).toFixed(2)} USD</p>
            <p className="text-xs text-green-600">Customer: {invoice.customer_name}</p>
          </div>

          <div>
            <Label className="text-xs">Date Received</Label>
            <Input type="date" value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} className="mt-1" />
          </div>

          <div>
            <Label className="text-xs">Payment Method</Label>
            <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transfer">Bank Transfer / Wise</SelectItem>
                <SelectItem value="card">Credit / Debit Card</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Reference # <span className="text-slate-400">(e.g. confirmation code)</span></Label>
            <Input placeholder="e.g. 739932" value={form.payment_reference} onChange={e => setForm(f => ({ ...f, payment_reference: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Transaction # <span className="text-slate-400">(optional)</span></Label>
            <Input placeholder="e.g. TXN-2104175446" value={form.payment_transaction_number} onChange={e => setForm(f => ({ ...f, payment_transaction_number: e.target.value }))} className="mt-1" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={saving} className="bg-green-600 hover:bg-green-700 gap-2">
              <CheckCircle className="h-4 w-4" />
              {saving ? "Saving..." : "Mark as Paid"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}