import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Bell, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { QUARTERS, getFilingDeadline } from "./TaxUtils";
import { format, isAfter, isBefore, differenceInDays } from "date-fns";

const YEAR = new Date().getFullYear();

export default function FilingCalendar() {
  const [year, setYear] = useState(YEAR);
  const today = new Date();

  const { data: filingRecords = [] } = useQuery({
    queryKey: ["tax_filing_records"],
    queryFn: () => base44.entities.TaxFilingRecord.list(),
    initialData: [],
  });

  const getStatus = (quarter) => {
    const rec = filingRecords.find(r => r.quarter === quarter && r.year === year);
    return rec?.status || "Pending";
  };

  const getDeadlineStatus = (deadlineDate) => {
    const days = differenceInDays(deadlineDate, today);
    if (days < 0) return { label: "Overdue", color: "bg-red-100 text-red-700 border-red-200" };
    if (days === 0) return { label: "Due Today!", color: "bg-red-100 text-red-700 border-red-200" };
    if (days <= 7) return { label: `${days}d left`, color: "bg-amber-100 text-amber-700 border-amber-200" };
    if (days <= 21) return { label: `${days}d left`, color: "bg-yellow-100 text-yellow-700 border-yellow-200" };
    return { label: `${days}d away`, color: "bg-slate-100 text-slate-600 border-slate-200" };
  };

  const quarters = QUARTERS.map(q => {
    const { reminderDate, deadlineDate } = getFilingDeadline(q.key, year);
    const status = getStatus(q.key);
    const deadlineSt = getDeadlineStatus(deadlineDate);
    const isPast = isAfter(today, deadlineDate);
    const isReminderPeriod = isAfter(today, reminderDate) && isBefore(today, deadlineDate);

    return { ...q, reminderDate, deadlineDate, status, deadlineSt, isPast, isReminderPeriod };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Filing Calendar</h3>
        <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[YEAR, YEAR - 1, YEAR + 1].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <CalendarDays className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-indigo-800">
          <strong>Filing Schedule:</strong> Quarterly sales tax returns are due the 21st of the month following the end of each quarter. Preparation reminders are set for the 10th.
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quarters.map(q => (
          <Card key={q.key} className={`border-2 ${q.status === "Filed" ? "border-emerald-200" : q.isReminderPeriod ? "border-amber-300" : "border-slate-200"}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-lg font-bold text-slate-900">{q.key} {year}</p>
                  <p className="text-xs text-slate-400">{q.name}</p>
                </div>
                {q.status === "Filed"
                  ? <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" />Filed</Badge>
                  : q.isReminderPeriod
                    ? <Badge className="bg-amber-100 text-amber-700 border-amber-200"><AlertTriangle className="h-3 w-3 mr-1" />Action Needed</Badge>
                    : <Badge className="bg-slate-100 text-slate-600 border-slate-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
                }
              </div>

              <div className="space-y-3">
                {/* Preparation Reminder */}
                <div className={`rounded-lg p-3 ${isAfter(today, q.reminderDate) && q.status !== "Filed" ? "bg-amber-50 border border-amber-200" : "bg-slate-50 border border-slate-200"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-slate-700">Preparation Reminder</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{format(q.reminderDate, "MMMM d, yyyy")}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{q.filingMonthName} 10th — Begin preparing your report</p>
                </div>

                {/* Deadline */}
                <div className={`rounded-lg p-3 ${q.status === "Filed" ? "bg-emerald-50 border border-emerald-200" : isAfter(today, q.reminderDate) ? "bg-red-50 border border-red-200" : "bg-slate-50 border border-slate-200"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-xs font-semibold text-slate-700">Official Filing Deadline</span>
                    </div>
                    {q.status !== "Filed" && (
                      <Badge className={`text-[10px] ${q.deadlineSt.color}`}>{q.deadlineSt.label}</Badge>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-800">{format(q.deadlineDate, "MMMM d, yyyy")}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{q.filingMonthName} 21st — Submit to state portal</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}