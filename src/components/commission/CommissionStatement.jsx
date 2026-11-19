import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, getDaysInMonth } from "date-fns";
import { Download, ChevronLeft, ChevronRight, Lock, Loader2, CheckCircle2 } from "lucide-react";

function exportStatementPDF(ref, periodLabel) {
  import("jspdf").then(({ default: jsPDF }) => {
    import("html2canvas").then(({ default: html2canvas }) => {
      html2canvas(ref, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = (canvas.height * pdfW) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
        pdf.save(`Commission_Statement_${periodLabel.replace(" ", "_")}.pdf`);
      });
    });
  });
}

export default function CommissionStatement({ selectedMonth, selectedYear, onMonthChange }) {
  const queryClient = useQueryClient();
  const statementRef = useRef(null);
  const [closing, setClosing] = useState(false);
  const [closedMsg, setClosedMsg] = useState("");

  const { data: settings = [] } = useQuery({
    queryKey: ["commission_settings"],
    queryFn: () => base44.entities.CommissionSettings.list(),
    initialData: [],
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices_for_commission"],
    queryFn: () => base44.entities.Invoice.filter({ payment_status: "Paid" }),
    initialData: [],
  });

  const { data: wholesaleInvoices = [] } = useQuery({
    queryKey: ["wholesale_invoices_for_commission"],
    queryFn: () => base44.entities.WholesaleInvoice.filter({ status: "Paid" }),
    initialData: [],
  });

  const { data: commissionInvoices = [] } = useQuery({
    queryKey: ["commission_invoices"],
    queryFn: () => base44.entities.CommissionInvoice.list("-issued_date", 100),
    initialData: [],
  });

  const commissionRate = settings[0]?.commission_rate || 15;

  const periodStart = new Date(selectedYear, selectedMonth, 1);
  const periodEnd = new Date(selectedYear, selectedMonth, getDaysInMonth(periodStart));

  // Payment due: day 10 of the subsequent month
  const paymentDueDate = new Date(selectedYear, selectedMonth + 1, 10);

  // Compare date strings directly to avoid timezone offset issues
  const periodStartStr2 = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`;
  const periodEndStr2 = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(getDaysInMonth(periodStart)).padStart(2, "0")}`;

  const isInPeriod = (dateStr) => {
    if (!dateStr) return false;
    const d = dateStr.slice(0, 10); // "YYYY-MM-DD"
    return d >= periodStartStr2 && d <= periodEndStr2;
  };

  const directSales = invoices
    .filter((inv) => isInPeriod(inv.payment_date))
    .reduce((sum, inv) => sum + (inv.subtotal || 0), 0);

  const wholesaleSales = wholesaleInvoices
    .filter((inv) => isInPeriod(inv.invoice_date))
    .reduce((sum, inv) => sum + (inv.subtotal || 0), 0);

  const grossSales = directSales + wholesaleSales;
  const commissionAmount = (grossSales * commissionRate) / 100;
  const periodLabel = format(periodStart, "MMMM yyyy");
  const periodStartStr = periodStart.toISOString().split("T")[0];

  const existingInvoice = commissionInvoices.find((ci) => ci.period_start === periodStartStr);
  const isClosed = !!existingInvoice;

  const prevMonth = () => {
    if (selectedMonth === 0) onMonthChange(11, selectedYear - 1);
    else onMonthChange(selectedMonth - 1, selectedYear);
  };
  const nextMonth = () => {
    if (selectedMonth === 11) onMonthChange(0, selectedYear + 1);
    else onMonthChange(selectedMonth + 1, selectedYear);
  };

  const handleCloseMonth = async () => {
    setClosing(true);
    setClosedMsg("");
    try {
      const res = await base44.functions.invoke("generateCommissionReport", {
        month: selectedMonth,
        year: selectedYear,
        generateInvoice: true,
      });
      queryClient.invalidateQueries({ queryKey: ["commission_invoices"] });
      queryClient.invalidateQueries({ queryKey: ["commission_reports"] });
      setClosedMsg(`Mês fechado! Invoice ${res.data?.invoice_number || ""} gerado.`);
    } catch (e) {
      setClosedMsg("Erro ao fechar mês: " + e.message);
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Month selector */}
      <div className="flex items-center justify-between bg-white rounded-lg border p-4">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <p className="text-xl font-bold text-slate-900">{periodLabel}</p>
          <p className="text-xs text-slate-500">
            {format(periodStart, "MMM d")} – {format(periodEnd, "MMM d, yyyy")}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Statement card */}
      <div ref={statementRef}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Commission Statement — {periodLabel}</CardTitle>
            {isClosed && (
              <Badge className="bg-green-100 text-green-800 gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Closed
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Gross Sales</p>
                  <p className="text-2xl font-bold text-slate-900">${grossSales.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Commission Rate</p>
                  <p className="text-2xl font-bold text-slate-900">{commissionRate}%</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Commission Due</p>
                  <p className="text-2xl font-bold text-green-600">${commissionAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Payment Due</p>
                  <p className="text-2xl font-bold text-slate-900">{format(paymentDueDate, "MMM d, yyyy")}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Day 10 of following month</p>
                </div>
              </div>

              {/* Breakdown */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Direct Sales (by payment date)</span>
                  <span className="font-medium">${directSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Wholesale Sales</span>
                  <span className="font-medium">${wholesaleSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-semibold">
                  <span>Total Gross Sales</span>
                  <span>${grossSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-700 font-bold">
                  <span>Commission ({commissionRate}%)</span>
                  <span>${commissionAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 pt-1 border-t text-xs">
                  <span>Payment deadline</span>
                  <span>{format(paymentDueDate, "MMMM d, yyyy")} (day 10 of {format(paymentDueDate, "MMMM")})</span>
                </div>
              </div>

              {isClosed && existingInvoice && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                  Invoice <strong>{existingInvoice.invoice_number}</strong> gerado em{" "}
                  {existingInvoice.issued_date ? format(new Date(existingInvoice.issued_date), "MMM d, yyyy") : "–"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {closedMsg && <p className="text-sm text-green-700 font-medium">{closedMsg}</p>}

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => exportStatementPDF(statementRef.current, periodLabel)}
        >
          <Download className="h-4 w-4" />
          Export PDF
        </Button>

        {!isClosed && (
          <Button
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handleCloseMonth}
            disabled={closing || grossSales === 0}
          >
            {closing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {closing ? "Fechando mês..." : "Fechar Mês & Gerar Invoice"}
          </Button>
        )}
      </div>
    </div>
  );
}