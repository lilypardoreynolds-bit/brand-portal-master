import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { computeKPIs, txnAmountForProduct, txnQtyForProduct } from "@/lib/ledgerCalc";
import { getBrandName } from "@/lib/appSettings";

function fmtMoney(n) {
  const v = Number(n) || 0;
  return (v < 0 ? "-$" : "$") + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function downloadCSV(filename, rows) {
  const csv = rows.map((r) => r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LedgerReports({ transactions, productId, productName }) {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("pnl");
  const [exporting, setExporting] = useState(false);

  const k = computeKPIs(transactions, productId);

  const reportMeta = {
    pnl: { label: "Product Profit & Loss", headers: ["Metric", "Amount"] },
    investment: { label: "Investment Summary", headers: ["Component", "Amount"] },
    expense: { label: "Expense Breakdown", headers: ["Category", "Amount"] },
    revenue: { label: "Revenue Summary", headers: ["Category", "Amount"] },
    category: { label: "Cost by Category", headers: ["Category", "Amount", "Qty"] },
    inventory: { label: "Inventory Valuation", headers: ["Metric", "Value"] },
    roi: { label: "ROI Report", headers: ["Metric", "Value"] },
  };

  const buildRows = () => {
    switch (reportType) {
      case "pnl":
        return [
          ["Total Investment", k.investment],
          ["Total Revenue", k.revenue],
          ["Total Expenses", k.expenses],
          ["Gross Profit", k.grossProfit],
          ["Net Profit", k.netProfit],
          ["Profit Margin (%)", k.profitMargin.toFixed(1)],
          ["ROI (%)", k.roi.toFixed(1)],
        ];
      case "investment":
        return Object.entries(k.landed).map(([key, val]) => [key, val]);
      case "expense": {
        const map = {};
        transactions.filter((t) => t.transaction_type === "expense").forEach((t) => {
          const amt = txnAmountForProduct(t, productId);
          map[t.category] = (map[t.category] || 0) + amt;
        });
        return Object.entries(map);
      }
      case "revenue": {
        const map = {};
        transactions.filter((t) => t.transaction_type === "revenue").forEach((t) => {
          const amt = txnAmountForProduct(t, productId);
          map[t.category] = (map[t.category] || 0) + amt;
        });
        return Object.entries(map);
      }
      case "category":
        return transactions.map((t) => [t.category, txnAmountForProduct(t, productId), txnQtyForProduct(t, productId)]);
      case "inventory":
        return [
          ["Units Purchased", k.unitsPurchased],
          ["Units Sold", k.unitsSold],
          ["Units Remaining", k.unitsRemaining],
          ["Avg Cost / Unit", k.avgCostPerUnit],
          ["Landed Cost / Unit", k.landedCostPerUnit],
          ["Current Inventory Value", k.inventoryValue],
        ];
      case "roi":
        return [
          ["Total Investment", k.investment],
          ["Net Profit", k.netProfit],
          ["ROI (%)", k.roi.toFixed(1)],
          ["Profit Margin (%)", k.profitMargin.toFixed(1)],
          ["Break-even / Unit", k.breakEvenPrice],
          ["Investment to Recover", k.remainingToRecover],
        ];
      default:
        return [];
    }
  };

  const rows = buildRows();
  const meta = reportMeta[reportType];

  const exportCSV = () => {
    downloadCSV(`${productName}_${reportType}_report.csv`, [meta.headers, ...rows]);
    toast({ title: "CSV exported" });
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const GREEN = [120, 175, 134];
      const GREEN_DARK = [74, 124, 94];

      doc.setFillColor(...GREEN);
      doc.rect(0, 0, 210, 28, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.text(`${meta.label}`, 14, 13);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Product: ${productName}`, 14, 20);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 20);

      let y = 40;
      doc.setTextColor(...GREEN_DARK);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      meta.headers.forEach((h, i) => {
        doc.text(h, i === 0 ? 14 : 140, y);
      });
      y += 3;
      doc.setDrawColor(...GREEN);
      doc.line(14, y, 196, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);
      rows.forEach((row) => {
        doc.text(String(row[0] || ""), 14, y);
        const val = typeof row[1] === "number" ? fmtMoney(row[1]) : String(row[1] ?? "");
        doc.text(val, 140, y);
        if (row[2] !== undefined) doc.text(String(row[2]), 170, y);
        y += 7;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });

      doc.setFillColor(232, 248, 239);
      doc.rect(0, 283, 210, 14, "F");
      doc.setTextColor(...GREEN_DARK);
      doc.setFontSize(7.5);
      doc.text(`${getBrandName()} — Product Financial Ledger Report`, 14, 291);

      doc.save(`${productName}_${reportType}_report.pdf`);
      toast({ title: "PDF exported" });
    } catch (err) {
      toast({ title: "PDF export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-64 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(reportMeta).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCSV}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportPDF} disabled={exporting}>
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />} Export PDF
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b">
                {meta.headers.map((h) => (
                  <th key={h} className="text-left px-4 py-2 font-semibold text-slate-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-2 text-slate-700 capitalize">{row[0]}</td>
                  <td className="px-4 py-2 text-right font-medium text-slate-900">
                    {typeof row[1] === "number" ? fmtMoney(row[1]) : row[1]}
                  </td>
                  {meta.headers[2] && <td className="px-4 py-2 text-right text-slate-600">{row[2] ?? ""}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400">
          CSV export is Excel-compatible — open the downloaded .csv file in Excel or Google Sheets.
        </p>
      </CardContent>
    </Card>
  );
}