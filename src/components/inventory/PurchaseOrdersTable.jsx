import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Truck, ArrowUpDown, CheckCircle2 } from "lucide-react";

const fmt = (date) => date ? new Date(date).toLocaleDateString() : "—";

const STATUSES = ["Draft", "Ordered", "Paid", "In Transit", "Delivered", "Cancelled"];

const STATUS_COLORS = {
  "Draft": "bg-slate-100 text-slate-600",
  "Ordered": "bg-blue-100 text-blue-700",
  "Paid": "bg-indigo-100 text-indigo-700",
  "In Transit": "bg-yellow-100 text-yellow-700",
  "Delivered": "bg-green-100 text-green-700",
  "Cancelled": "bg-red-100 text-red-700",
};

export default function PurchaseOrdersTable({ orders, onEdit, onDelete, onRecordMovement, onMarkDelivered, onStatusChange }) {
  const [pendingChange, setPendingChange] = useState(null); // { po, newStatus }

  const handleStatusSelect = (po, newStatus) => {
    if (newStatus === po.status) return;
    setPendingChange({ po, newStatus });
  };

  const confirmChange = () => {
    if (!pendingChange) return;
    const { po, newStatus } = pendingChange;
    if (newStatus === "Delivered") {
      onMarkDelivered && onMarkDelivered(po);
    } else {
      onStatusChange && onStatusChange(po, newStatus);
    }
    setPendingChange(null);
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="bg-slate-100 rounded-full p-4 mb-3">
          <Truck className="h-8 w-8 text-slate-400" />
        </div>
        <p className="text-slate-600 font-medium">No purchase orders yet</p>
        <p className="text-sm text-slate-400 mt-1">Create your first PO to track manufacturer orders</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">PO #</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Order Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Est. Delivery</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tracking</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map(po => (
              <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{po.po_number || "—"}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{po.product_name}</td>
                <td className="px-4 py-3 text-slate-600">{po.supplier_name || "—"}</td>
                <td className="px-4 py-3 text-slate-700">{po.quantity?.toLocaleString()}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">${(po.total_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{fmt(po.order_date)}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{fmt(po.expected_delivery)}</td>
                <td className="px-4 py-3">
                  <Select value={po.status} onValueChange={(val) => handleStatusSelect(po, val)}>
                    <SelectTrigger className={`h-7 text-xs font-medium border-0 shadow-none px-2 py-0 rounded-full w-auto gap-1 ${STATUS_COLORS[po.status] || "bg-slate-100 text-slate-600"}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => (
                        <SelectItem key={s} value={s}>
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${STATUS_COLORS[s]}`}>{s}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 max-w-[140px]">
                  {po.tracking_number ? (
                    <div>
                      <span className="font-mono truncate block">{po.tracking_number}</span>
                      {po.carrier && <span className="text-slate-400">{po.carrier}</span>}
                    </div>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Record Movement" onClick={() => onRecordMovement && onRecordMovement(po)}>
                      <ArrowUpDown className="h-3.5 w-3.5 text-indigo-400" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(po)}>
                      <Pencil className="h-3.5 w-3.5 text-slate-400" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(po)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!pendingChange} onOpenChange={() => setPendingChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Status</AlertDialogTitle>
            <AlertDialogDescription>
              Change PO <span className="font-semibold font-mono">{pendingChange?.po?.po_number}</span> status from{" "}
              <span className="font-semibold">{pendingChange?.po?.status}</span> to{" "}
              <span className="font-semibold">{pendingChange?.newStatus}</span>?
              {pendingChange?.newStatus === "Delivered" && (
                <span className="block mt-2 text-green-700 font-medium">This will trigger the delivery confirmation flow and update inventory.</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmChange}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}