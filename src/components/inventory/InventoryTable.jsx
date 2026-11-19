import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, AlertTriangle, XCircle, CheckCircle2, ArrowUpDown, ArrowRight, Warehouse } from "lucide-react";

const WAREHOUSE_STYLES = {
  "Own Warehouse": "bg-blue-100 text-blue-700",
  "Amazon FBA":    "bg-orange-100 text-orange-700",
  "Other":         "bg-slate-100 text-slate-600",
};

function StockStatus({ available, minStock }) {
  if (available <= 0) return <Badge className="bg-red-100 text-red-700 border-red-200 text-[11px] gap-1"><XCircle className="h-3 w-3" />Out of Stock</Badge>;
  if (minStock > 0 && available <= minStock) return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[11px] gap-1"><AlertTriangle className="h-3 w-3" />Low Stock</Badge>;
  return <Badge className="bg-green-100 text-green-700 border-green-200 text-[11px] gap-1"><CheckCircle2 className="h-3 w-3" />In Stock</Badge>;
}

export default function InventoryTable({ inventory, onEdit, onDelete, onAddMovement, onTransfer }) {
  if (inventory.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Product</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Warehouse</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600">On Hand</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600">Reserved</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600">Available</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 hidden md:table-cell">Min / Max</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 hidden lg:table-cell">Location</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 hidden md:table-cell">Unit Cost</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600">Value</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inventory.map(item => {
              const onHand = item.on_hand ?? item.current_stock ?? 0;
              const reserved = item.reserved ?? 0;
              const available = Math.max(0, onHand - reserved);
              const value = onHand * (item.unit_cost || 0);
              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{item.product_name}</p>
                    {item.sku && <p className="text-xs text-slate-400">SKU: {item.sku}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-[11px] ${WAREHOUSE_STYLES[item.warehouse] || WAREHOUSE_STYLES["Other"]}`}>
                      {item.warehouse || "Own Warehouse"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-slate-900 text-base">{onHand}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-amber-700 text-base">{reserved}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold text-base ${available > 0 ? "text-green-700" : "text-red-700"}`}>{available}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-500">
                    {item.min_stock_level || 0} / {item.max_stock_level || "∞"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-500">
                    {item.warehouse_location || "—"}
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell text-slate-600">
                    ${(item.unit_cost || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                    ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3"><StockStatus available={available} minStock={item.min_stock_level} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {onTransfer && (item.warehouse === "Own Warehouse" || !item.warehouse) && (
                        <Button size="sm" variant="ghost" onClick={() => onTransfer(item)} className="h-7 px-2 text-xs gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                          <ArrowRight className="h-3 w-3" />
                          <span className="hidden lg:inline">Transfer</span>
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => onAddMovement(item.id)} className="h-7 px-2 text-xs gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                        <ArrowUpDown className="h-3 w-3" />
                        <span className="hidden lg:inline">Move</span>
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => onEdit(item)} className="h-7 w-7"><Pencil className="h-3.5 w-3.5 text-slate-400" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => onDelete(item)} className="h-7 w-7"><Trash2 className="h-3.5 w-3.5 text-red-400" /></Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}