import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";

const TYPE_CONFIG = {
  Inbound:    { style: "bg-green-100 text-green-700",  prefix: "+" },
  Outbound:   { style: "bg-red-100 text-red-700",      prefix: "-" },
  Adjustment: { style: "bg-blue-100 text-blue-700",    prefix: "→" },
  Transfer:   { style: "bg-orange-100 text-orange-700", prefix: "⇄" },
};

export default function MovementsTable({ movements, onDelete, limit }) {
  const displayed = limit ? movements.slice(0, limit) : movements;
  if (displayed.length === 0) return (
    <div className="text-center py-8 text-slate-400 text-sm">No movements recorded yet.</div>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Product</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Type</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600">Qty</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 hidden md:table-cell">Details</th>
              {onDelete && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayed.map(m => {
              const cfg = TYPE_CONFIG[m.movement_type] || TYPE_CONFIG.Adjustment;
              return (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {m.date ? format(new Date(m.date), "MMM d, yyyy") : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{m.product_name}</td>
                  <td className="px-4 py-3">
                    <Badge className={`${cfg.style} border-0 text-xs`}>{m.movement_type}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800">
                    <span className={
                      m.movement_type === "Inbound" ? "text-green-600" :
                      m.movement_type === "Outbound" ? "text-red-600" :
                      m.movement_type === "Transfer" ? "text-orange-600" : "text-blue-600"
                    }>
                      {cfg.prefix}{m.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs hidden md:table-cell">
                    {m.movement_type === "Transfer" ? (
                      <div>
                        <span className="text-slate-600 font-medium">{m.from_warehouse} → {m.to_warehouse}</span>
                        {m.shipping_cost > 0 && <span className="text-orange-600 ml-2">Shipping: ${m.shipping_cost?.toFixed(2)}</span>}
                      </div>
                    ) : (
                      <span className="text-slate-500">{m.reference || m.label || "—"}</span>
                    )}
                  </td>
                  {onDelete && (
                    <td className="px-4 py-3 text-right">
                      <Button size="icon" variant="ghost" onClick={() => onDelete(m)} className="h-7 w-7">
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}