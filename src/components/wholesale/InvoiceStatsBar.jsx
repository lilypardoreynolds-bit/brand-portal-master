import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, DollarSign, Clock, CheckCircle2 } from "lucide-react";

export default function InvoiceStatsBar({ invoices }) {
  const total = invoices.length;
  const paid = invoices.filter((i) => i.status === "Paid").length;
  const pending = invoices.filter((i) => ["Draft", "Sent"].includes(i.status)).length;
  const revenue = invoices
    .filter((i) => i.status === "Paid")
    .reduce((sum, i) => sum + (i.total || 0), 0);

  const stats = [
    { label: "Total Invoices", value: total, icon: FileText, color: "bg-indigo-50 text-indigo-600", border: "border-indigo-100" },
    { label: "Total Revenue", value: `$${revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, color: "bg-emerald-50 text-emerald-600", border: "border-emerald-100" },
    { label: "Pending Payments", value: pending, icon: Clock, color: "bg-amber-50 text-amber-600", border: "border-amber-100" },
    { label: "Paid Invoices", value: paid, icon: CheckCircle2, color: "bg-teal-50 text-teal-600", border: "border-teal-100" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.label} className={`border ${s.border}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-lg font-bold text-slate-800">{s.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}