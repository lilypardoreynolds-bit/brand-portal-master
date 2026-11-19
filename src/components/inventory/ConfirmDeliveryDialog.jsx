import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Package } from "lucide-react";

export default function ConfirmDeliveryDialog({ open, po, onClose, onConfirm, saving }) {
  const [qtyReceived, setQtyReceived] = useState(po?.quantity || 0);
  const [notes, setNotes] = useState("");

  // Reset when PO changes
  useEffect(() => {
    if (po) {
      setQtyReceived(po.quantity || 0);
      setNotes("");
    }
  }, [po]);

  if (!po) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Confirm Delivery
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">PO #</span>
              <span className="font-mono font-medium">{po.po_number || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Product</span>
              <span className="font-medium">{po.product_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ordered Qty</span>
              <span className="font-medium">{po.quantity?.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-1.5 mb-1">
              <Package className="h-3.5 w-3.5" />
              Quantity Received *
            </Label>
            <Input
              type="number"
              min={0}
              value={qtyReceived}
              onChange={e => setQtyReceived(Number(e.target.value))}
            />
            {qtyReceived !== po.quantity && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠ Received quantity differs from ordered ({po.quantity?.toLocaleString()})
              </p>
            )}
          </div>

          <div>
            <Label className="mb-1">Notes (optional)</Label>
            <Textarea
              placeholder="Condition, discrepancies, etc."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            onClick={() => onConfirm({ qtyReceived, notes })}
            disabled={saving || qtyReceived <= 0}
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            {saving ? "Processing..." : "Confirm & Add to Inventory"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}