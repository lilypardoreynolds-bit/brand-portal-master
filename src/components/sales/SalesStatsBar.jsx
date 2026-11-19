import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, ShoppingCart, TrendingUp, Package, BarChart2, Percent } from "lucide-react";

function computeCOGS(orderItems, products) {
  return orderItems.reduce((sum, item) => {
    const product = products.find(p => p.id === item.product_id);
    if (!product) return sum;
    const cogs =
      (product.manufacturing_cost || 0) +
      (product.packaging_cost || 0) +
      (product.shipping_cost || 0) +
      (product.import_duties_cost || 0) +
      (product.fulfillment_cost || 0) +
      (product.storage_cost || 0) +
      (product.marketplace_fees || 0) +
      (product.marketing_cost_per_unit || 0) +
      (product.other_costs || 0);
    return sum + cogs * (item.quantity || 1);
  }, 0);
}

export default function SalesStatsBar({ orders, orderItems = [], products = [] }) {
  const completed = orders.filter(o => o.order_status === "Completed");
  const totalRevenue = completed.reduce((s, o) => s + (o.total || 0), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? orders.reduce((s, o) => s + (o.total || 0), 0) / totalOrders : 0;
  const pendingCount = orders.filter(o => o.order_status === "Pending" || o.order_status === "Processing").length;

  const completedItemIds = new Set(completed.map(o => o.id));
  const completedItems = orderItems.filter(i => completedItemIds.has(i.order_id));
  const totalCOGS = computeCOGS(completedItems, products);
  const totalProfit = totalRevenue - totalCOGS;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const stats = [
    { label: "Total Revenue", value: `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Orders", value: totalOrders, icon: ShoppingCart, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Avg Order Value", value: `$${avgOrderValue.toFixed(2)}`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Active Orders", value: pendingCount, icon: Package, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Gross Profit", value: `$${totalProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: BarChart2, color: totalProfit >= 0 ? "text-emerald-600" : "text-red-600", bg: totalProfit >= 0 ? "bg-emerald-50" : "bg-red-50" },
    { label: "Profit Margin", value: `${profitMargin.toFixed(1)}%`, icon: Percent, color: profitMargin >= 20 ? "text-emerald-600" : profitMargin >= 10 ? "text-yellow-600" : "text-red-600", bg: profitMargin >= 20 ? "bg-emerald-50" : profitMargin >= 10 ? "bg-yellow-50" : "bg-red-50" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map(s => (
        <Card key={s.label} className="border border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`h-4.5 w-4.5 ${s.color}`} />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium leading-tight">{s.label}</p>
              <p className="text-lg font-bold text-slate-800 leading-tight">{s.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}