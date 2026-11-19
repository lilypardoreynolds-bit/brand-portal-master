import React, { useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar, Download } from "lucide-react";
import { getBrandName, getBrandLogo } from "@/lib/appSettings";

function downloadReportPDF(report) {
  // Build a hidden HTML element, render with html2canvas, then save as PDF
  const LOGO = getBrandLogo();
  const BRAND = getBrandName();
  const GREEN = "#78AF86";
  const GREEN_DARK = "#4a7c5e";
  const GREEN_LIGHT = "#E8F8EF";

  const statusBadge = {
    Generated: { bg: "#dbeafe", color: "#1e40af", label: "Generated" },
    Invoiced:  { bg: "#ede9fe", color: "#6d28d9", label: "Invoiced" },
    Paid:      { bg: "#dcfce7", color: "#15803d", label: "Paid" },
  }[report.status] || { bg: "#f1f5f9", color: "#475569", label: report.status };

  const periodStr = report.period_start && report.period_end
    ? `${format(new Date(report.period_start), "MMM d")} – ${format(new Date(report.period_end), "MMM d, yyyy")}`
    : "–";
  const dueStr = report.payment_due_date
    ? format(new Date(report.payment_due_date), "MMMM d, yyyy")
    : "–";
  const generatedStr = format(new Date(), "MMMM d, yyyy");

  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;background:#fff;font-family:helvetica,arial,sans-serif;";

  container.innerHTML = `
    <div style="width:794px;min-height:1123px;background:#fff;display:flex;flex-direction:column;">

      <!-- HEADER -->
      <div style="background:${GREEN};padding:36px 48px 28px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="color:#fff;font-size:22px;font-weight:700;letter-spacing:0.5px;margin-bottom:4px;">Commission Report</div>
          <div style="color:rgba(255,255,255,0.75);font-size:13px;">${report.reporting_period || ""}</div>
        </div>
        ${LOGO ? `<img src="${LOGO}" style="height:72px;object-fit:contain;border-radius:6px;" crossorigin="anonymous"/>` : `<div style="font-size:22px;font-weight:700;color:#fff;">${BRAND}</div>`}
      </div>

      <!-- GREEN ACCENT BAR -->
      <div style="height:5px;background:linear-gradient(90deg,#B5D1B4,#78AF86,#B5D1B4);"></div>

      <!-- META INFO -->
      <div style="background:${GREEN_LIGHT};padding:18px 48px;display:flex;align-items:center;justify-content:space-between;">
        <div style="font-size:12px;color:#4a7c5e;">
          <span style="font-weight:600;">Period:</span> ${periodStr}
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:12px;color:#4a7c5e;font-weight:600;">Status:</span>
          <span style="background:${statusBadge.bg};color:${statusBadge.color};padding:3px 12px;border-radius:999px;font-size:11px;font-weight:700;">
            ${statusBadge.label}
          </span>
        </div>
      </div>

      <!-- BODY -->
      <div style="padding:40px 48px;flex:1;">

        <!-- SUMMARY CARDS -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:36px;">
          <div style="border:1.5px solid #c8e6c9;border-radius:10px;padding:18px 20px;background:#fff;">
            <div style="font-size:10px;color:#4a7c5e;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">Gross Sales</div>
            <div style="font-size:22px;font-weight:700;color:#2d4a3a;">$${(report.total_gross_sales || 0).toFixed(2)}</div>
          </div>
          <div style="border:1.5px solid #c8e6c9;border-radius:10px;padding:18px 20px;background:#fff;">
            <div style="font-size:10px;color:#4a7c5e;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">Commission Rate</div>
            <div style="font-size:22px;font-weight:700;color:#2d4a3a;">${report.commission_rate || 0}%</div>
          </div>
          <div style="border:1.5px solid #c8e6c9;border-radius:10px;padding:18px 20px;background:#f0fdf4;">
            <div style="font-size:10px;color:#15803d;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">Commission Due</div>
            <div style="font-size:22px;font-weight:700;color:#15803d;">$${(report.total_commission_due || 0).toFixed(2)}</div>
          </div>
        </div>

        <!-- BREAKDOWN TABLE -->
        <div style="margin-bottom:32px;">
          <div style="font-size:13px;font-weight:700;color:${GREEN_DARK};margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid ${GREEN};">
            Financial Breakdown
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
              <tr style="background:${GREEN};color:#fff;">
                <th style="text-align:left;padding:10px 14px;border-radius:6px 0 0 0;">Description</th>
                <th style="text-align:right;padding:10px 14px;border-radius:0 6px 0 0;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background:#f0fdf4;">
                <td style="padding:11px 14px;border-bottom:1px solid #c8e6c9;color:#2d4a3a;">Total Gross Sales</td>
                <td style="padding:11px 14px;border-bottom:1px solid #c8e6c9;text-align:right;font-weight:600;color:#2d4a3a;">$${(report.total_gross_sales || 0).toFixed(2)}</td>
              </tr>
              <tr style="background:#fff;">
                <td style="padding:11px 14px;border-bottom:1px solid #c8e6c9;color:#2d4a3a;">Commission Rate Applied</td>
                <td style="padding:11px 14px;border-bottom:1px solid #c8e6c9;text-align:right;font-weight:600;color:#2d4a3a;">${report.commission_rate || 0}%</td>
              </tr>
              <tr style="background:#f0fdf4;">
                <td style="padding:12px 14px;color:#15803d;font-weight:700;">Total Commission Due</td>
                <td style="padding:12px 14px;text-align:right;font-weight:700;color:#15803d;font-size:14px;">$${(report.total_commission_due || 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAYMENT INFO -->
        <div style="background:${GREEN_LIGHT};border:1.5px solid #c8e6c9;border-radius:10px;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:10px;color:#4a7c5e;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">Payment Due Date</div>
            <div style="font-size:16px;font-weight:700;color:${GREEN_DARK};">${dueStr}</div>
            <div style="font-size:11px;color:#4a7c5e;margin-top:2px;">Day 10 of the following month</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:10px;color:#4a7c5e;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">Report Generated</div>
            <div style="font-size:13px;color:${GREEN_DARK};">${generatedStr}</div>
          </div>
        </div>

        ${report.notes ? `
        <div style="margin-top:24px;background:#f0fdf4;border-left:4px solid ${GREEN};padding:14px 18px;border-radius:0 8px 8px 0;">
          <div style="font-size:11px;font-weight:700;color:${GREEN};margin-bottom:6px;text-transform:uppercase;letter-spacing:0.6px;">Notes</div>
          <div style="font-size:12px;color:#2d4a3a;line-height:1.6;">${report.notes}</div>
        </div>` : ""}

      </div>

      <!-- FOOTER -->
      <div style="background:${GREEN_DARK};padding:18px 48px;display:flex;align-items:center;justify-content:space-between;margin-top:auto;">
        <div style="color:rgba(255,255,255,0.9);font-size:11px;font-weight:600;">${BRAND} — Agency Commission Report</div>
        <div style="color:rgba(255,255,255,0.55);font-size:10px;">Confidential · ${generatedStr}</div>
      </div>

    </div>
  `;

  document.body.appendChild(container);

  Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]).then(([{ default: html2canvas }, { default: jsPDF }]) => {
    html2canvas(container.firstElementChild, { scale: 2, useCORS: true, logging: false }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      pdf.save(`Commission_Report_${(report.reporting_period || "report").replace(/\s/g, "_")}.pdf`);
      document.body.removeChild(container);
    });
  });
}

export default function CommissionReports() {
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["commission_reports"],
    queryFn: () => base44.entities.CommissionReport.list('-period_end', 24),
    initialData: [],
  });

  const statusColors = {
    Generated: "bg-blue-100 text-blue-800",
    Invoiced: "bg-purple-100 text-purple-800",
    Paid: "bg-green-100 text-green-800",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission Reports</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-slate-500">Loading reports...</p>
        ) : reports.length === 0 ? (
          <p className="text-slate-500 text-sm">No commission reports yet</p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-900">{report.reporting_period}</p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(report.period_start), "MMM d")} - {format(new Date(report.period_end), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge className={statusColors[report.status] || "bg-slate-100 text-slate-800"}>
                    {report.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Gross Sales</p>
                    <p className="font-semibold text-slate-900">${report.total_gross_sales?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Rate</p>
                    <p className="font-semibold text-slate-900">{report.commission_rate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Commission Due</p>
                    <p className="font-semibold text-green-600">${report.total_commission_due?.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Due: {format(new Date(report.payment_due_date), "MMM d, yyyy")}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-7 text-xs"
                    onClick={() => downloadReportPDF(report)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}