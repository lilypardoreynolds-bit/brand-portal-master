import React from "react";
import { AlertTriangle, XCircle } from "lucide-react";

export default function LowStockAlerts({ inventory }) {
  const lowStock = inventory.filter(i => {
    const onHand = i.on_hand ?? i.current_stock ?? 0;
    return i.min_stock_level > 0 && onHand <= i.min_stock_level && onHand > 0;
  });
  const outOfStock = inventory.filter(i => (i.on_hand ?? i.current_stock ?? 0) <= 0);

  if (lowStock.length === 0 && outOfStock.length === 0) return null;

  return (
    <div className="space-y-2">
      {outOfStock.map(i => (
        <div key={i.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border bg-red-50 border-red-200 text-red-800 text-sm">
          <XCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
          <span className="flex-1"><strong>{i.product_name}</strong> is out of stock{i.warehouse_location ? ` (${i.warehouse_location})` : ""}</span>
        </div>
      ))}
      {lowStock.map(i => (
        <div key={i.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border bg-amber-50 border-amber-200 text-amber-800 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />
          <span className="flex-1"><strong>{i.product_name}</strong> is low on stock — {i.on_hand ?? i.current_stock ?? 0} units left (min: {i.min_stock_level})</span>
        </div>
      ))}
    </div>
  );
}