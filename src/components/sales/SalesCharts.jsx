import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { format, parseISO, startOfMonth } from "date-fns";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

function computeItemCOGS(item, products) {
  const product = products.find(p => p.id === item.product_id);
  if (!product) return 0;
  const unitCOGS =
    (product.manufacturing_cost || 0) +
    (product.packaging_cost || 0) +
    (product.shipping_cost || 0) +
    (product.import_duties_cost || 0) +
    (product.fulfillment_cost || 0) +
    (product.storage_cost || 0) +
    (product.marketplace_fees || 0) +
    (product.marketing_cost_per_unit || 0) +
    (product.other_costs || 0);
  return unitCOGS * (item.quantity || 1);
}

export default function SalesCharts({ orders, orderItems = [], products = [] }) {
  // Sales + profit by month
  const monthMap = {};
  orders.forEach(o => {
    if (!o.order_date) return;
    const month = format(startOfMonth(parseISO(o.order_date)), "MMM yy");
    if (!monthMap[month]) monthMap[month] = { month, revenue: 0, cogs: 0 };
    monthMap[month].revenue += o.total || 0;
    const items = orderItems.filter(i => i.order_id === o.id);
    monthMap[month].cogs += items.reduce((s, i) => s + computeItemCOGS(i, products), 0);
  });
  const monthlyData = Object.values(monthMap)
    .map(d => ({ ...d, profit: d.revenue - d.cogs }))
    .slice(-6);

  // Sales by channel
  const channelMap = {};
  orders.forEach(o => {
    const ch = o.sales_channel_name || "Direct";
    channelMap[ch] = (channelMap[ch] || 0) + (o.total || 0);
  });
  const channelData = Object.entries(channelMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="border border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700">Revenue vs Profit by Month</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v, name) => [`$${Number(v).toFixed(2)}`, name.charAt(0).toUpperCase() + name.slice(1)]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700">Revenue by Channel</CardTitle>
        </CardHeader>
        <CardContent>
          {channelData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={channelData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {channelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => `$${Number(v).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}