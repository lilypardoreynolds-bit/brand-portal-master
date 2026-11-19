import React from "react";
import { Package, DollarSign, Clock, Warehouse } from "lucide-react";

export default function InventoryStatsBar({ inventory }) {
  const own = inventory.filter(i => !i.warehouse || i.warehouse === "Own Warehouse");
  const fba = inventory.filter(i => i.warehouse === "Amazon FBA");

  const sum = (arr, field) => arr.reduce((s, i) => s + (i[field] ?? 0), 0);
  const sumOnHand = (arr) => arr.reduce((s, i) => s + (i.on_hand ?? i.current_stock ?? 0), 0);
  const sumValue = (arr) => arr.reduce((s, i) => s + ((i.on_hand ?? i.current_stock ?? 0) * (i.unit_cost || 0)), 0);

  const totalValue = sumValue(inventory);
  const pendingOrders = sum(inventory, "reserved");
  const fbaShippingCosts = sum(fba, "fba_shipping_cost_total");

  const stats = [
    {
      label: "Own Warehouse",
      value: sumOnHand(own),
      sub: `${own.length} product(s)`,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Amazon FBA",
      value: sumOnHand(fba),
      sub: fbaShippingCosts > 0 ? `$${fbaShippingCosts.toFixed(2)} shipping in` : `${fba.length} product(s)`,
      icon: Warehouse,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Inventory Value",
      value: `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: "all warehouses",
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Reserved (Orders)",
      value: pendingOrders,
      sub: "units reserved",
      icon: Clock,
      color: pendingOrders > 0 ? "text-amber-600" : "text-slate-400",
      bg: pendingOrders > 0 ? "bg-amber-50" : "bg-slate-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(s => (
        <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className={`${s.bg} p-2.5 rounded-lg flex-shrink-0`}>
            <s.icon className={`h-4 w-4 ${s.color}`} />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs font-medium text-slate-600">{s.label}</p>
            <p className="text-[11px] text-slate-400">{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}