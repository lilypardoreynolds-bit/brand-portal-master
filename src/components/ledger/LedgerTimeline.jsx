import React from "react";
import { format } from "date-fns";
import { TX_TYPE_LABELS, TX_TYPE_COLORS } from "@/lib/ledgerCalc";

function fmtMoney(n) {
  const v = Number(n) || 0;
  return (v < 0 ? "-$" : "$") + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const EVENT_ICON = {
  investment: "📦",
  expense: "💸",
  revenue: "💰",
  adjustment: "⚖️",
};

export default function LedgerTimeline({ transactions, productId }) {
  const rows = [...transactions].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  if (rows.length === 0) {
    return <div className="text-center py-12 text-slate-400 border rounded-lg bg-white">No timeline events yet.</div>;
  }
  return (
    <div className="bg-white border rounded-lg p-6">
      <ol className="relative border-l-2 border-slate-100 ml-3">
        {rows.map((txn) => (
          <li key={txn.id} className="mb-6 ml-6">
            <span className="absolute -left-[13px] flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 ring-4 ring-white text-sm">
              {EVENT_ICON[txn.transaction_type]}
            </span>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">{txn.category}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${TX_TYPE_COLORS[txn.transaction_type]}`}>
                    {TX_TYPE_LABELS[txn.transaction_type]}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{txn.date ? format(new Date(txn.date), "MMM d, yyyy") : "—"}</span>
              </div>
              <p className="text-xs text-slate-600">
                {txn.counterparty && <span className="font-medium">{txn.counterparty} — </span>}
                {txn.description || txn.category}
              </p>
              <div className="flex gap-4 mt-1 text-xs">
                {txn.quantity > 0 && <span className="text-slate-500">{txn.quantity} units</span>}
                <span className={txn.transaction_type === "revenue" ? "text-emerald-700 font-semibold" : "text-rose-600 font-semibold"}>
                  {txn.transaction_type === "revenue" ? "+" : "-"}{fmtMoney((txn.amount_in || 0) + (txn.amount_out || 0))}
                </span>
                {txn.reference_number && <span className="text-slate-400">Ref: {txn.reference_number}</span>}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}