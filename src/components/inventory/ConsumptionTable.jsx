import React from "react";
import { Badge } from "@/components/ui/badge";
import { PackageX } from "lucide-react";

function fmtMoney(n) {
  return "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const REASON_COLORS = {
  "Marketing Sample": "bg-purple-100 text-purple-700 border-purple-200",
  "Influencer Campaign": "bg-pink-100 text-pink-700 border-pink-200",
  "Product Giveaway": "bg-blue-100 text-blue-700 border-blue-200",
  "Internal Use": "bg-slate-100 text-slate-700 border-slate-200",
  "Damaged": "bg-red-100 text-red-700 border-red-200",
  "Expired": "bg-orange-100 text-orange-700 border-orange-200",
  "Donation": "bg-green-100 text-green-700 border-green-200",
  "Quality Testing": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Return to Supplier": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Inventory Adjustment": "bg-gray-100 text-gray-700 border-gray-200",
};

export default function ConsumptionTable({ consumptions = [] }) {
  if (consumptions.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="bg-slate-100 rounded-full p-4 mb-3">
          <PackageX className="h-8 w-8 text-slate-400" />
        </div>
        <p className="text-slate-600 font-medium">No consumption records yet</p>
        <p className="text-sm text-slate-400 mt-1">Record inventory consumption for samples, donations, damages, etc.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b">
            <th className="text-left px-4 py-2 font-semibold text-slate-600 text-xs uppercase">Date</th>
            <th className="text-left px-4 py-2 font-semibold text-slate-600 text-xs uppercase">Product</th>
            <th className="text-left px-4 py-2 font-semibold text-slate-600 text-xs uppercase">Reason</th>
            <th className="text-left px-4 py-2 font-semibold text-slate-600 text-xs uppercase">Dept</th>
            <th className="text-left px-4 py-2 font-semibold text-slate-600 text-xs uppercase">Campaign</th>
            <th className="text-right px-4 py-2 font-semibold text-slate-600 text-xs uppercase">Qty</th>
            <th className="text-right px-4 py-2 font-semibold text-slate-600 text-xs uppercase">Unit Cost</th>
            <th className="text-right px-4 py-2 font-semibold text-slate-600 text-xs uppercase">Total Value</th>
          </tr>
        </thead>
        <tbody>
          {consumptions.map(c => (
            <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50">
              <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{c.date ? new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "—"}</td>
              <td className="px-4 py-2 text-slate-800 font-medium whitespace-nowrap">{c.product_name}{c.warehouse ? <span className="text-slate-400 text-xs ml-1">({c.warehouse})</span> : ""}</td>
              <td className="px-4 py-2"><Badge variant="outline" className={REASON_COLORS[c.reason] || "bg-slate-100 text-slate-700"}>{c.reason}</Badge></td>
              <td className="px-4 py-2 text-slate-600">{c.department}</td>
              <td className="px-4 py-2 text-slate-500 text-xs">{c.related_campaign || "—"}</td>
              <td className="px-4 py-2 text-right text-slate-800 font-medium">{c.quantity}</td>
              <td className="px-4 py-2 text-right text-slate-600">{fmtMoney(c.landed_unit_cost)}</td>
              <td className="px-4 py-2 text-right text-slate-900 font-semibold">{fmtMoney(c.total_value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}