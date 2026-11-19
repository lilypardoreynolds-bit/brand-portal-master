import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const productCostOf = (a) => a.product_cost ?? Math.round((a.quantity || 0) * (a.unit_cost || 0) * 100) / 100;
const totalCostOf = (a) => a.total_cost ?? Math.round((productCostOf(a) + (a.shipping_cost || 0)) * 100) / 100;

const STATUS_COLORS = {
  Allocated: "bg-violet-100 text-violet-700",
  Shipped: "bg-blue-100 text-blue-700",
  Completed: "bg-emerald-100 text-emerald-700",
};

export default function AllocationsTable({ allocations, onDelete }) {
  if (allocations.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Product / Variant</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Program</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Warehouse</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600">Qty</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600">Product Cost</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600">Shipping</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600">Total Cost</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allocations.map(a => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{a.product_name}</p>
                  {a.notes && <p className="text-xs text-slate-400">{a.notes}</p>}
                </td>
                <td className="px-4 py-3 text-slate-600">{a.program}</td>
                <td className="px-4 py-3 text-slate-600">{a.warehouse}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">{a.quantity}</td>
                <td className="px-4 py-3 text-right text-slate-600">
                  ${productCostOf(a).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  ${(a.shipping_cost || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">
                  ${totalCostOf(a).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-slate-600">{a.date}</td>
                <td className="px-4 py-3">
                  <Badge className={cn("text-[11px]", STATUS_COLORS[a.status] || "bg-slate-100 text-slate-600")}>{a.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {onDelete && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDelete(a)} title="Delete allocation">
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
