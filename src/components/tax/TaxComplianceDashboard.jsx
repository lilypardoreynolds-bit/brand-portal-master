import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  CalendarDays, DollarSign, Receipt, CheckCircle2, Clock,
  AlertTriangle, Bell, ArrowRight, FileText, TrendingUp
} from "lucide-react";
import { aggregateByQuarter, getCurrentQuarter, getFilingDeadline, fmt, QUARTERS } from "./TaxUtils";
import { format, differenceInDays, isAfter } from "date-fns";

const YEAR = new Date().getFullYear();

export default function TaxComplianceDashboard() {
  const today = new Date();
  const currentQ = getCurrentQuarter();

  const { data: entries = [] } = useQuery({
    queryKey: ["sales_tax_entries"],
    queryFn: () => base44.entities.SalesTaxEntry.list("-order_date", 500),
    initialData: [],
  });

  const { data: filingRecords = [] } = useQuery({
    queryKey: ["tax_filing_records"],
    queryFn: () => base44.entities.TaxFilingRecord.list(),
    initialData: [],
  });

  const { data: taxDocs = [] } = useQuery({
    queryKey: ["tax_documents"],
    queryFn: () => base44.entities.TaxDocument.list(),
    initialData: [],
  });

  const aggregated = aggregateByQuarter(entries, YEAR);
  const currentQData = aggregated.find(q => q.quarter === currentQ.key) || { totalRevenue: 0, taxCollected: 0, taxableSales: 0, exemptSales: 0 };

  const { reminderDate, deadlineDate } = getFilingDeadline(currentQ.key, YEAR);
  const daysToDeadline = differenceInDays(deadlineDate, today);
  const isInReminderPeriod = isAfter(today, reminderDate) && daysToDeadline >= 0;
  const isOverdue = daysToDeadline < 0;

  const filedCount = filingRecords.filter(r => r.status === "Filed").length;
  const pendingCount = 4 - filedCount; // 4 quarters total
  const currentQFiled = filingRecords.find(r => r.quarter === currentQ.key && r.year === YEAR)?.status === "Filed";

  const expiringDocs = taxDocs.filter(d => {
    if (!d.expiration_date) return false;
    return differenceInDays(new Date(d.expiration_date), today) <= 30;
  });

  // Next upcoming quarter to file
  const nextQuarterToFile = QUARTERS.find(q => {
    const rec = filingRecords.find(r => r.quarter === q.key && r.year === YEAR);
    return !rec || rec.status !== "Filed";
  });
  const nextQDeadline = nextQuarterToFile ? getFilingDeadline(nextQuarterToFile.key, YEAR) : null;
  const nextQData = nextQuarterToFile ? aggregated.find(a => a.quarter === nextQuarterToFile.key) : null;

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {(isInReminderPeriod || isOverdue || expiringDocs.length > 0) && (
        <div className="space-y-2">
          {isOverdue && !currentQFiled && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-800 flex-1">
                <strong>Sales tax filing overdue!</strong> {currentQ.key} {YEAR} deadline was {format(deadlineDate, "MMMM d")}. Submit your report to the state portal immediately.
              </p>
            </div>
          )}
          {isInReminderPeriod && !currentQFiled && !isOverdue && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <Bell className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-800 flex-1">
                <strong>Filing preparation reminder:</strong> Quarterly sales tax filing deadline approaching on {format(deadlineDate, "MMMM d")}. Begin preparing your {currentQ.key} report.
              </p>
            </div>
          )}
          {expiringDocs.length > 0 && (
            <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
              <p className="text-sm text-yellow-800">{expiringDocs.length} tax document(s) expiring soon. Review your Tax Documents.</p>
            </div>
          )}
        </div>
      )}

      {/* Current Quarter Summary */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Current Quarter — {currentQ.key} {YEAR} ({currentQ.name})</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: DollarSign, label: "Total Revenue", value: fmt(currentQData.totalRevenue), color: "text-emerald-700", bg: "bg-emerald-50" },
            { icon: Receipt, label: "Tax Collected", value: fmt(currentQData.taxCollected), color: "text-indigo-700", bg: "bg-indigo-50" },
            { icon: TrendingUp, label: "Tax Due", value: fmt(currentQData.taxCollected), color: "text-violet-700", bg: "bg-violet-50" },
            { icon: CheckCircle2, label: "Filed Reports", value: `${filedCount}/4`, color: filedCount === 4 ? "text-emerald-700" : "text-amber-700", bg: filedCount === 4 ? "bg-emerald-50" : "bg-amber-50" },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-4 ${s.bg} flex flex-col gap-1`}>
              <s.icon className={`h-4 w-4 ${s.color} opacity-70`} />
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Current Quarter Filing Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Filing Status */}
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-slate-800">Current Quarter Filing</h4>
              {currentQFiled
                ? <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" />Filed</Badge>
                : isOverdue
                  ? <Badge className="bg-red-100 text-red-700 border-red-200"><AlertTriangle className="h-3 w-3 mr-1" />Overdue</Badge>
                  : isInReminderPeriod
                    ? <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Bell className="h-3 w-3 mr-1" />Due Soon</Badge>
                    : <Badge className="bg-slate-100 text-slate-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
              }
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Quarter</span><strong>{currentQ.key} {YEAR}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Period</span><strong>{currentQ.name}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Prep Reminder</span><strong>{format(reminderDate, "MMMM d")}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Filing Deadline</span><strong className={isOverdue ? "text-red-600" : ""}>{format(deadlineDate, "MMMM d")}</strong></div>
              {!currentQFiled && <div className="flex justify-between"><span className="text-slate-500">Days to Deadline</span><strong className={daysToDeadline < 0 ? "text-red-600" : daysToDeadline <= 7 ? "text-amber-600" : ""}>{daysToDeadline < 0 ? `${Math.abs(daysToDeadline)} days overdue` : `${daysToDeadline} days`}</strong></div>}
            </div>
          </CardContent>
        </Card>

        {/* Next Filing Card */}
        {nextQuarterToFile && nextQDeadline && (
          <Card className="border-indigo-200 bg-indigo-50">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="h-4 w-4 text-indigo-600" />
                <h4 className="font-semibold text-indigo-900">Next Tax Filing</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-indigo-700">Quarter</span><strong className="text-indigo-900">{nextQuarterToFile.key} {YEAR}</strong></div>
                <div className="flex justify-between"><span className="text-indigo-700">Prep Reminder</span><strong className="text-indigo-900">{format(nextQDeadline.reminderDate, "MMMM d")}</strong></div>
                <div className="flex justify-between"><span className="text-indigo-700">Filing Deadline</span><strong className="text-indigo-900">{format(nextQDeadline.deadlineDate, "MMMM d")}</strong></div>
                <div className="flex justify-between"><span className="text-indigo-700">Tax Due</span><strong className="text-indigo-900">{fmt(nextQData?.taxCollected || 0)}</strong></div>
                <div className="flex justify-between"><span className="text-indigo-700">Status</span>
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pending Actions */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Pending Actions</h3>
        <Card className="border-slate-200">
          <CardContent className="p-0">
            {pendingCount === 0 && expiringDocs.length === 0 ? (
              <div className="flex items-center gap-3 p-5">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <p className="text-sm text-slate-500">All quarterly filings complete. No pending actions.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {QUARTERS.filter(q => {
                  const rec = filingRecords.find(r => r.quarter === q.key && r.year === YEAR);
                  return !rec || rec.status !== "Filed";
                }).map(q => {
                  const { deadlineDate } = getFilingDeadline(q.key, YEAR);
                  const days = differenceInDays(deadlineDate, today);
                  return (
                    <li key={q.key} className="flex items-center justify-between px-5 py-3 gap-4">
                      <div className="flex items-center gap-3">
                        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${days < 0 ? "bg-red-500" : days <= 7 ? "bg-amber-500" : "bg-slate-300"}`} />
                        <p className="text-sm font-medium text-slate-700">{q.key} {YEAR} — File sales tax return</p>
                      </div>
                      <p className={`text-xs font-medium ${days < 0 ? "text-red-600" : days <= 7 ? "text-amber-600" : "text-slate-400"}`}>
                        Due {format(deadlineDate, "MMM d")}
                      </p>
                    </li>
                  );
                })}
                {expiringDocs.map(doc => (
                  <li key={doc.id} className="flex items-center justify-between px-5 py-3 gap-4">
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full flex-shrink-0 bg-amber-500" />
                      <p className="text-sm font-medium text-slate-700">Renew: {doc.document_name}</p>
                    </div>
                    <p className="text-xs font-medium text-amber-600">Expires {format(new Date(doc.expiration_date), "MMM d")}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Quarters Overview */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">All Quarters {YEAR}</h3>
        <Card className="border-slate-200">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{["Quarter","Period","Revenue","Taxable","Exempt","Tax Collected","Status"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {aggregated.map(q => {
                  const filed = filingRecords.find(r => r.quarter === q.quarter && r.year === YEAR)?.status === "Filed";
                  return (
                    <tr key={q.quarter} className={q.quarter === currentQ.key ? "bg-indigo-50/50" : "hover:bg-slate-50"}>
                      <td className="px-4 py-3 font-bold text-slate-900">{q.quarter}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{q.name}</td>
                      <td className="px-4 py-3 font-medium">{fmt(q.totalRevenue)}</td>
                      <td className="px-4 py-3 text-slate-600">{fmt(q.taxableSales)}</td>
                      <td className="px-4 py-3 text-slate-600">{fmt(q.exemptSales)}</td>
                      <td className="px-4 py-3 font-semibold text-indigo-700">{fmt(q.taxCollected)}</td>
                      <td className="px-4 py-3">
                        <Badge className={filed ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"}>
                          {filed ? "Filed" : "Pending"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}