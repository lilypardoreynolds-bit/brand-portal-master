import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function computeItemCOGS(item, products) {
  const product = products.find(p => p.id === item.product_id);
  if (!product) return 0;
  
  // Importation costs
  const unitImportation =
    (product.manufacturing_cost || 0) +
    (product.packaging_cost || 0) +
    (product.shipping_cost || 0) +
    (product.import_duties_cost || 0) +
    (product.fulfillment_cost || 0) +
    (product.storage_cost || 0) +
    (product.marketing_cost_per_unit || 0) +
    (product.other_costs || 0);
  
  const importationTotal = unitImportation * (item.quantity || 1);
  
  // OPS costs: 25% of line revenue
  const opsCosts = (item.line_total || 0) * 0.25;
  
  return importationTotal + opsCosts;
}

export default function ProfitabilityPanel({ orders, orderItems, products, inventory }) {
  // Per-product profitability
  const productMap = {};
  orderItems.forEach(item => {
    const key = item.product_name || "Unknown";
    if (!productMap[key]) productMap[key] = { revenue: 0, cogs: 0, units: 0, product_id: item.product_id };
    productMap[key].revenue += item.line_total || 0;
    productMap[key].cogs += computeItemCOGS(item, products);
    productMap[key].units += item.quantity || 0;
  });

  const productRows = Object.entries(productMap)
    .map(([name, data]) => ({
      name,
      revenue: data.revenue,
      cogs: data.cogs,
      profit: data.revenue - data.cogs,
      margin: data.revenue > 0 ? ((data.revenue - data.cogs) / data.revenue) * 100 : 0,
      units: data.units,
      stock: inventory.find(i => i.product_id === data.product_id)?.current_stock ?? "—",
    }))
    .sort((a, b) => b.profit - a.profit);

  // Per-channel profitability
  const channelMap = {};
  orders.forEach(o => {
    const ch = o.sales_channel_name || "Direct";
    if (!channelMap[ch]) channelMap[ch] = { revenue: 0, orders: 0, orderIds: [] };
    channelMap[ch].revenue += o.total || 0;
    channelMap[ch].orders += 1;
    channelMap[ch].orderIds.push(o.id);
  });

  const channelRows = Object.entries(channelMap)
    .map(([name, data]) => {
      const items = orderItems.filter(i => data.orderIds.includes(i.order_id));
      const cogs = items.reduce((s, i) => s + computeItemCOGS(i, products), 0);
      const profit = data.revenue - cogs;
      return {
        name,
        revenue: data.revenue,
        orders: data.orders,
        profit,
        margin: data.revenue > 0 ? (profit / data.revenue) * 100 : 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const marginBadge = (margin) => {
    if (margin >= 30) return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">{margin.toFixed(1)}%</Badge>;
    if (margin >= 10) return <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">{margin.toFixed(1)}%</Badge>;
    return <Badge className="bg-red-100 text-red-700 border-0 text-xs">{margin.toFixed(1)}%</Badge>;
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* Product Profitability */}
      <Card className="border border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700">Profitability by Product</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {productRows.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No sales data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="pb-2 px-4 text-xs text-slate-500 font-semibold">Product</th>
                    <th className="pb-2 px-2 text-xs text-slate-500 font-semibold text-right">Units</th>
                    <th className="pb-2 px-2 text-xs text-slate-500 font-semibold text-right">Revenue</th>
                    <th className="pb-2 px-2 text-xs text-slate-500 font-semibold text-right">COGS</th>
                    <th className="pb-2 px-2 text-xs text-slate-500 font-semibold text-right">Profit</th>
                    <th className="pb-2 px-4 text-xs text-slate-500 font-semibold text-right">Margin</th>
                    <th className="pb-2 px-4 text-xs text-slate-500 font-semibold text-right">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {productRows.map(row => (
                    <tr key={row.name} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-medium text-slate-800 max-w-[120px] truncate">{row.name}</td>
                      <td className="py-2.5 px-2 text-slate-600 text-right">{row.units}</td>
                      <td className="py-2.5 px-2 text-slate-700 text-right">${row.revenue.toFixed(2)}</td>
                      <td className="py-2.5 px-2 text-slate-500 text-right">${row.cogs.toFixed(2)}</td>
                      <td className={`py-2.5 px-2 font-semibold text-right ${row.profit >= 0 ? "text-emerald-700" : "text-red-600"}`}>${row.profit.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right">{marginBadge(row.margin)}</td>
                      <td className="py-2.5 px-4 text-right text-slate-600">{row.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Channel Profitability */}
      <Card className="border border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700">Profitability by Channel</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {channelRows.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No sales data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="pb-2 px-4 text-xs text-slate-500 font-semibold">Channel</th>
                    <th className="pb-2 px-2 text-xs text-slate-500 font-semibold text-right">Orders</th>
                    <th className="pb-2 px-2 text-xs text-slate-500 font-semibold text-right">Revenue</th>
                    <th className="pb-2 px-2 text-xs text-slate-500 font-semibold text-right">Profit</th>
                    <th className="pb-2 px-4 text-xs text-slate-500 font-semibold text-right">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {channelRows.map(row => (
                    <tr key={row.name} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-medium text-slate-800">{row.name}</td>
                      <td className="py-2.5 px-2 text-slate-600 text-right">{row.orders}</td>
                      <td className="py-2.5 px-2 text-slate-700 text-right">${row.revenue.toFixed(2)}</td>
                      <td className={`py-2.5 px-2 font-semibold text-right ${row.profit >= 0 ? "text-emerald-700" : "text-red-600"}`}>${row.profit.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right">{marginBadge(row.margin)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}