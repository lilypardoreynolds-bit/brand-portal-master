import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeLandedCostBreakdown } from "@/lib/ledgerCalc";
import { Calculator } from "lucide-react";

function fmtMoney(n) {
  const v = Number(n) || 0;
  return (v < 0 ? "-$" : "$") + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function LandedCostBreakdown({ transactions, productId }) {
  const b = computeLandedCostBreakdown(transactions, productId);

  const rows = [
    { label: "Purchase Cost", total: b.purchaseAmount, perUnit: b.supplierUnitCost },
    { label: "Allocated Freight", total: b.allocated.freight, perUnit: b.perUnit.freight },
    { label: "Allocated Duties", total: b.allocated.duties, perUnit: b.perUnit.duties },
    { label: "Allocated Other Fees", total: b.allocated.otherFees, perUnit: b.perUnit.otherFees },
    { label: "Allocated Packaging", total: b.allocated.packaging, perUnit: b.perUnit.packaging },
    { label: "Allocated Inspection", total: b.allocated.inspection, perUnit: b.perUnit.inspection },
    { label: "Allocated Prep / Handling", total: b.allocated.prep, perUnit: b.perUnit.prep },
    { label: "Other Allocated Costs", total: b.allocated.other, perUnit: b.perUnit.other },
  ];

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Calculator className="h-4 w-4 text-[var(--brand)]" />
          Landed Cost Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Left: Breakdown table with Total + Per Unit columns */}
          <div>
            <div className="grid grid-cols-[1fr_90px_90px] gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 pb-1.5 border-b border-slate-100">
              <span>Cost Component</span>
              <span className="text-right">Total Spent</span>
              <span className="text-right">Per Unit</span>
            </div>
            {rows.map((r) => (
              <div key={r.label} className="grid grid-cols-[1fr_90px_90px] gap-2 py-1.5 text-sm">
                <span className={r.total === 0 ? "text-slate-400" : "text-slate-600"}>{r.label}</span>
                <span className={`text-right tabular-nums ${r.total === 0 ? "text-slate-400" : "text-slate-700"}`}>{fmtMoney(r.total)}</span>
                <span className={`text-right tabular-nums ${r.perUnit === 0 ? "text-slate-400" : "text-slate-700"}`}>{fmtMoney(r.perUnit)}</span>
              </div>
            ))}
            <div className="grid grid-cols-[1fr_90px_90px] gap-2 py-1.5 text-sm border-t border-slate-200 mt-1 pt-2.5">
              <span className="font-semibold text-slate-900">Total Allocated Costs</span>
              <span className="text-right tabular-nums font-semibold text-slate-900">{fmtMoney(b.totalAllocatedCosts)}</span>
              <span className="text-right tabular-nums font-semibold text-slate-900">{fmtMoney(b.totalAllocatedPerUnit)}</span>
            </div>
            <div className="grid grid-cols-[1fr_90px_90px] gap-2 py-1.5 text-sm">
              <span className="font-bold text-slate-900">Total Landed Cost</span>
              <span className="text-right tabular-nums font-bold text-slate-900">{fmtMoney(b.totalLandedCost)}</span>
              <span className="text-right tabular-nums font-bold text-emerald-700">{fmtMoney(b.landedUnitCost)}</span>
            </div>
          </div>

          {/* Right: Key metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 lg:border-l lg:border-slate-100 lg:pl-6">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Supplier Unit Cost</p>
              <p className="text-lg font-bold text-slate-900">{fmtMoney(b.supplierUnitCost)}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600 mb-1">Landed Unit Cost</p>
              <p className="text-lg font-bold text-emerald-700">{fmtMoney(b.landedUnitCost)}</p>
              <p className="text-[10px] text-emerald-500 mt-0.5">Weighted average</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Quantity Purchased</p>
              <p className="text-lg font-bold text-slate-900">{b.quantityPurchased.toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Total Investment</p>
              <p className="text-lg font-bold text-slate-900">{fmtMoney(b.totalInvestment)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Total cash spent</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}