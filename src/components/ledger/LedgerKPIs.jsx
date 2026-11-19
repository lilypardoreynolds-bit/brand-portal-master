import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { computeKPIs } from "@/lib/ledgerCalc";

function fmtMoney(n) {
  const v = Number(n) || 0;
  return (v < 0 ? "-$" : "$") + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtPct(n) {
  return `${(Number(n) || 0).toFixed(1)}%`;
}

function KPICard({ label, value, sub, tone }) {
  const toneClass = {
    green: "text-emerald-700",
    red: "text-rose-600",
    blue: "text-blue-700",
    slate: "text-slate-900",
  }[tone] || "text-slate-900";
  return (
    <Card className="border-slate-200">
      <CardContent className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{label}</p>
        <p className={`text-xl font-bold ${toneClass}`}>{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function LedgerKPIs({ transactions, productId }) {
  const k = computeKPIs(transactions, productId);
  const cards = [
    { label: "Total Investment", value: fmtMoney(k.investment), tone: "slate" },
    { label: "Total Revenue", value: fmtMoney(k.revenue), tone: "blue" },
    { label: "Total Expenses", value: fmtMoney(k.expenses), tone: "slate" },
    { label: "Gross Profit", value: fmtMoney(k.grossProfit), tone: k.grossProfit >= 0 ? "green" : "red" },
    { label: "Net Profit", value: fmtMoney(k.netProfit), tone: k.netProfit >= 0 ? "green" : "red" },
    { label: "Current Inventory Value", value: fmtMoney(k.inventoryValue), tone: "slate" },
    { label: "Avg Cost / Unit", value: fmtMoney(k.avgCostPerUnit), tone: "slate" },
    { label: "Landed Cost / Unit", value: fmtMoney(k.landedCostPerUnit), tone: "slate" },
    { label: "Units Purchased", value: k.unitsPurchased.toLocaleString(), tone: "slate" },
    { label: "Units Sold", value: k.unitsSold.toLocaleString(), tone: "slate" },
    { label: "Units Remaining", value: k.unitsRemaining.toLocaleString(), tone: "slate" },
    { label: "ROI", value: fmtPct(k.roi), tone: k.roi >= 0 ? "green" : "red" },
    { label: "Profit Margin", value: fmtPct(k.profitMargin), tone: k.profitMargin >= 0 ? "green" : "red" },
    { label: "Break-even / Unit", value: fmtMoney(k.breakEvenPrice), tone: "slate" },
    { label: "Investment to Recover", value: fmtMoney(k.remainingToRecover), tone: k.remainingToRecover > 0 ? "red" : "green" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <KPICard key={c.label} {...c} />
      ))}
    </div>
  );
}