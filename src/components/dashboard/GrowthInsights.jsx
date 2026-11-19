import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { TrendingUp, Award, ShoppingBag, AlertTriangle, Sparkles, ArrowRight } from "lucide-react";

export default function GrowthInsights({ products = [], orders = [], inventory = [] }) {
  // Top product by profit margin
  const productsWithMargin = products.map(p => {
    const cost = p.unit_cost || p.cost_per_unit || 0;
    const price = p.retail_price || p.wholesale_price || 0;
    const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
    return { ...p, margin };
  });

  const topByProfit = [...productsWithMargin].sort((a, b) => b.margin - a.margin)[0];
  const lowMargin = productsWithMargin.filter(p => p.margin > 0 && p.margin < 20);
  const highGrowth = productsWithMargin.filter(p => p.margin >= 40);

  // Best channel
  const channelMap = {};
  orders.forEach(o => {
    if (o.sales_channel_name) {
      channelMap[o.sales_channel_name] = (channelMap[o.sales_channel_name] || 0) + (o.total || 0);
    }
  });
  const bestChannel = Object.entries(channelMap).sort((a, b) => b[1] - a[1])[0];

  const insights = [
    {
      icon: Award,
      label: "Top Product by Profit",
      value: topByProfit ? `${topByProfit.product_name || topByProfit.name} (${topByProfit.margin.toFixed(0)}% margin)` : "No data yet",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      icon: ShoppingBag,
      label: "Best Sales Channel",
      value: bestChannel ? `${bestChannel[0]} — $${bestChannel[1].toLocaleString()}` : "No orders yet",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      icon: AlertTriangle,
      label: "Low Margin Products",
      value: lowMargin.length > 0 ? `${lowMargin.length} product${lowMargin.length > 1 ? "s" : ""} under 20% margin` : "All margins healthy",
      color: lowMargin.length > 0 ? "text-amber-600" : "text-emerald-600",
      bg: lowMargin.length > 0 ? "bg-amber-50" : "bg-emerald-50",
    },
    {
      icon: TrendingUp,
      label: "High Growth Potential",
      value: highGrowth.length > 0 ? `${highGrowth.length} product${highGrowth.length > 1 ? "s" : ""} with 40%+ margin` : "Optimize your margins",
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ];

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Growth Insights</CardTitle>
        </div>
        <Link to={createPageUrl("ProfitEngine")} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
          Profit Engine <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {insights.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className={`rounded-xl p-4 ${bg}`}>
            <div className={`flex items-center gap-2 mb-2 ${color}`}>
              <Icon className="h-4 w-4" />
              <p className="text-[10px] font-semibold uppercase tracking-wide">{label}</p>
            </div>
            <p className={`text-sm font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}