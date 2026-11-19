import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Receipt, Eye } from "lucide-react";

const ORDER_STATUS_COLORS = {
  Pending: "bg-yellow-100 text-yellow-700",
  Processing: "bg-blue-100 text-blue-700",
  Shipped: "bg-indigo-100 text-indigo-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

const PAYMENT_STATUS_COLORS = {
  Paid: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Refunded: "bg-red-100 text-red-700",
};

const FULFILLMENT_STATUS_COLORS = {
  "Not Fulfilled": "bg-slate-100 text-slate-700",
  "Partial": "bg-orange-100 text-orange-700",
  "Fulfilled": "bg-green-100 text-green-700",
};

export default function OrdersTable({ orders, onEdit, onDelete, onCreateInvoice, onUpdateFulfillment, onViewItems }) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-sm">No orders yet. Create your first order.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
           <tr className="border-b border-slate-200 text-left">
             <th className="pb-3 pr-4 font-semibold text-slate-600 text-xs uppercase tracking-wide">Order #</th>
             <th className="pb-3 pr-4 font-semibold text-slate-600 text-xs uppercase tracking-wide">Date</th>
             <th className="pb-3 pr-4 font-semibold text-slate-600 text-xs uppercase tracking-wide">Customer</th>
             <th className="pb-3 pr-4 font-semibold text-slate-600 text-xs uppercase tracking-wide">Channel</th>
             <th className="pb-3 pr-4 font-semibold text-slate-600 text-xs uppercase tracking-wide">Payment</th>
             <th className="pb-3 pr-4 font-semibold text-slate-600 text-xs uppercase tracking-wide">Fulfillment</th>
             <th className="pb-3 pr-4 font-semibold text-slate-600 text-xs uppercase tracking-wide">Deadline</th>
             <th className="pb-3 pr-4 font-semibold text-slate-600 text-xs uppercase tracking-wide text-right">Total</th>
             <th className="pb-3 font-semibold text-slate-600 text-xs uppercase tracking-wide"></th>
           </tr>
         </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map(o => (
            <tr key={o.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-3 pr-4 font-medium text-indigo-600">{o.order_number}</td>
              <td className="py-3 pr-4 text-slate-600">{o.order_date}</td>
              <td className="py-3 pr-4 text-slate-700">{o.customer_name || "—"}</td>
              <td className="py-3 pr-4 text-slate-600">{o.sales_channel_name || "—"}</td>
              <td className="py-3 pr-4">
                <Badge className={`${PAYMENT_STATUS_COLORS[o.payment_status] || ""} border-0 text-xs`}>{o.payment_status}</Badge>
              </td>
              <td className="py-3 pr-4">
                {onUpdateFulfillment ? (
                  <Select value={o.fulfillment_status || "Not Fulfilled"} onValueChange={v => onUpdateFulfillment(o.id, v, new Date().toISOString().split("T")[0])}>
                    <SelectTrigger className="h-6 w-28 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Not Fulfilled", "Partial", "Fulfilled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={`${FULFILLMENT_STATUS_COLORS[o.fulfillment_status] || ""} border-0 text-xs`}>{o.fulfillment_status || "Not Fulfilled"}</Badge>
                )}
              </td>
              <td className="py-3 pr-4 text-slate-600 text-xs">{o.fulfillment_deadline ? o.fulfillment_deadline : o.payment_date ? (() => { const d = new Date(o.payment_date); d.setDate(d.getDate() + 3); return d.toISOString().split("T")[0]; })() : "—"}</td>
              <td className="py-3 pr-4 font-semibold text-slate-800 text-right">${(o.total || 0).toFixed(2)}</td>
              <td className="py-3">
                <div className="flex gap-1 justify-end">
                  {onViewItems && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600" onClick={() => onViewItems(o)} title="View items"><Eye className="h-3.5 w-3.5" /></Button>
                  )}
                  {onCreateInvoice && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-green-600" onClick={() => onCreateInvoice(o)} title="Create invoice"><Receipt className="h-3.5 w-3.5" /></Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600" onClick={() => onEdit(o)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => onDelete(o.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}