import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Paperclip } from "lucide-react";
import { format } from "date-fns";

export default function ExpenseTable({ expenses, onEdit, onDelete }) {
  if (!expenses.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
        <p className="text-slate-400 text-sm">No expenses found. Try adjusting your filters or add a new expense.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Expense</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Category</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Vendor</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Type</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map(e => (
              <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                  {e.date ? format(new Date(e.date + "T00:00:00"), "MMM d, yyyy") : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{e.expense_name}</div>
                  {e.notes && <div className="text-xs text-slate-400 truncate max-w-[180px]">{e.notes}</div>}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full whitespace-nowrap">{e.category || "—"}</span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">{e.vendor || "—"}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                  ${(e.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <Badge variant="outline" className={e.expense_type === "Fixed" ? "border-blue-200 text-blue-700 bg-blue-50 text-xs" : "border-orange-200 text-orange-700 bg-orange-50 text-xs"}>
                    {e.expense_type || "—"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge className={e.payment_status === "Paid" ? "bg-green-100 text-green-700 hover:bg-green-100 text-xs" : "bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs"}>
                    {e.payment_status || "—"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-0.5 justify-end">
                    {e.attachment_url && (
                      <a href={e.attachment_url} target="_blank" rel="noreferrer">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700">
                          <Paperclip className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700" onClick={() => onEdit(e)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => onDelete(e.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}