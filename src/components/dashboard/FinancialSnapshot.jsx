import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { DollarSign, TrendingUp, Package, ArrowRight, BarChart2 } from "lucide-react";

function MetricCard({ icon: Icon, label, value, sub, color = "bg-indigo-50 text-indigo-600" }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-lg font-bold text-slate-900">{value}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

export default function FinancialSnapshot({ orders = [], products = [] }) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthlyOrders = orders.filter(o => o.order_date && new Date(o.order_date) >= monthStart);
  const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const unitsSold = monthlyOrders.reduce((sum, o) => sum + 1, 0);

  // Best product by revenue from orders
  const productRevMap = {};
  monthlyOrders.forEach(o => {
    if (o.sales_channel_name) {
      productRevMap[o.sales_channel_name] = (productRevMap[o.sales_channel_name] || 0) + (o.total || 0);
    }
  });

  // Estimated profit from products avg margin
  const avgMargin = products.length > 0
    ? products.reduce((sum, p) => {
        const cost = p.unit_cost || 0;
        const price = p.retail_price || p.wholesale_price || 0;
        if (price > 0) return sum + ((price - cost) / price) * 100;
        return sum;
      }, 0) / products.length
    : 0;

  const estimatedProfit = monthlyRevenue * (avgMargin / 100);

  const topProduct = products.length > 0 ? products[0]?.product_name || "—" : "—";

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Financial Snapshot</CardTitle>
        <Link to={createPageUrl("SalesDashboard")} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
          View Sales <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricCard
          icon={DollarSign}
          label="Monthly Revenue"
          value={`$${monthlyRevenue.toLocaleString("en-US", { minimumFractionDigits: 0 })}`}
          color="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          icon={TrendingUp}
          label="Est. Profit"
          value={`$${estimatedProfit.toLocaleString("en-US", { minimumFractionDigits: 0 })}`}
          color="bg-blue-50 text-blue-600"
        />
        <MetricCard
          icon={BarChart2}
          label="Profit Margin"
          value={`${avgMargin.toFixed(1)}%`}
          color="bg-violet-50 text-violet-600"
        />
        <MetricCard
          icon={Package}
          label="Units Sold"
          value={unitsSold.toLocaleString()}
          sub="This month"
          color="bg-amber-50 text-amber-600"
        />
        <MetricCard
          icon={TrendingUp}
          label="Top Product"
          value={topProduct}
          color="bg-rose-50 text-rose-600"
        />
      </CardContent>
    </Card>
  );
}