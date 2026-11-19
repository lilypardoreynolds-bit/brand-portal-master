import React from "react";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, FileDown } from "lucide-react";
import InvoiceStatusBadge from "./InvoiceStatusBadge";
import { format } from "date-fns";

const fmt = (n) => `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => { try { return d ? format(new Date(d), "MMM d, yyyy") : "—"; } catch { return d || "—"; } };

export default function InvoiceTable({ invoices, onView, onEdit, onDelete, onExport }) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p className="text-lg font-medium">No invoices yet</p>
        <p className="text-sm mt-1">Create your first wholesale invoice to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-slate-500 text-xs font-medium">
            <th className="text-left pb-3 pr-3">Invoice #</th>
            <th className="text-left pb-3 pr-3">Date</th>
            <th className="text-left pb-3 pr-3">Customer</th>
            <th className="text-left pb-3 pr-3">Company</th>
            <th className="text-left pb-3 pr-3">Type</th>
            <th className="text-left pb-3 pr-3">Status</th>
            <th className="text-right pb-3 pr-3">Total</th>
            <th className="text-right pb-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="py-3 pr-3 font-mono font-semibold text-indigo-700">{inv.invoice_number}</td>
              <td className="py-3 pr-3 text-slate-600">{fmtDate(inv.invoice_date)}</td>
              <td className="py-3 pr-3 font-medium text-slate-800">{inv.customer_name}</td>
              <td className="py-3 pr-3 text-slate-600">{inv.company_name || "—"}</td>
              <td className="py-3 pr-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{inv.customer_type}</span>
              </td>
              <td className="py-3 pr-3"><InvoiceStatusBadge status={inv.status} /></td>
              <td className="py-3 pr-3 text-right font-bold text-slate-800">{fmt(inv.total)}</td>
              <td className="py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600" onClick={() => onView(inv)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600" onClick={() => onEdit(inv)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-emerald-600" onClick={() => onExport(inv)}>
                    <FileDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => onDelete(inv)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}