import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Printer, CheckCircle2, Clock, Upload, Paperclip, X, ExternalLink } from "lucide-react";
import { aggregateByQuarter, fmt, QUARTERS } from "./TaxUtils";
import { format } from "date-fns";

const YEAR = new Date().getFullYear();
const YEARS = [YEAR, YEAR - 1, YEAR - 2];

export default function QuarterlyReports() {
  const qc = useQueryClient();
  const [year, setYear] = useState(YEAR);
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedQ, setSelectedQ] = useState(null);

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

  const { data: companies = [] } = useQuery({
    queryKey: ["company_profile"],
    queryFn: () => base44.entities.Company.list("-created_date", 1),
    initialData: [],
  });

  const markFiled = useMutation({
    mutationFn: ({ quarter, data }) => {
      const existing = filingRecords.find(r => r.quarter === quarter && r.year === year);
      if (existing) return base44.entities.TaxFilingRecord.update(existing.id, { ...data, status: "Filed", filed_date: format(new Date(), "yyyy-MM-dd") });
      return base44.entities.TaxFilingRecord.create({ ...data, status: "Filed", filed_date: format(new Date(), "yyyy-MM-dd") });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tax_filing_records"] }),
  });

  const aggregated = aggregateByQuarter(entries, year);
  const company = companies[0];
  const businessName = company?.brand_name || company?.company_name || "Your Business";

  const [uploading, setUploading] = useState(null); // quarter key being uploaded

  const getStatus = (quarter) => {
    const rec = filingRecords.find(r => r.quarter === quarter && r.year === year);
    return rec?.status || "Pending";
  };

  const getRecord = (quarter) => filingRecords.find(r => r.quarter === quarter && r.year === year);

  const handleAttach = async (quarter, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(quarter);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const rec = getRecord(quarter);
    const existing_urls = rec?.report_urls || [];
    if (rec) {
      await base44.entities.TaxFilingRecord.update(rec.id, { report_urls: [...existing_urls, file_url] });
    } else {
      await base44.entities.TaxFilingRecord.create({ quarter, year, status: "Pending", report_urls: [file_url] });
    }
    qc.invalidateQueries({ queryKey: ["tax_filing_records"] });
    setUploading(null);
  };

  const handleRemoveAttachment = async (quarter, idx) => {
    const rec = getRecord(quarter);
    if (!rec) return;
    const updated = rec.report_urls.filter((_, i) => i !== idx);
    await base44.entities.TaxFilingRecord.update(rec.id, { report_urls: updated });
    qc.invalidateQueries({ queryKey: ["tax_filing_records"] });
  };

  const openReport = (q) => { setSelectedQ(q); setReportOpen(true); };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Quarterly Tax Reports</h3>
        <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {aggregated.map(q => {
          const status = getStatus(q.quarter);
          const qInfo = QUARTERS.find(x => x.key === q.quarter);
          return (
            <Card key={q.quarter} className="border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-lg font-bold text-slate-900">{q.quarter} {year}</p>
                    <p className="text-xs text-slate-400">{q.name}</p>
                  </div>
                  <Badge className={status === "Filed" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"}>
                    {status === "Filed" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                    {status}
                  </Badge>
                </div>
                <div className="space-y-2 mb-4">
                  {[
                    { label: "Total Revenue", value: fmt(q.totalRevenue) },
                    { label: "Taxable Sales", value: fmt(q.taxableSales) },
                    { label: "Exempt Sales", value: fmt(q.exemptSales) },
                    { label: "Tax Collected", value: fmt(q.taxCollected), bold: true },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between text-sm">
                      <span className="text-slate-500">{row.label}</span>
                      <span className={row.bold ? "font-bold text-indigo-700" : "text-slate-800"}>{row.value}</span>
                    </div>
                  ))}
                </div>
                {/* Attachments */}
                {(() => {
                  const rec = getRecord(q.quarter);
                  const urls = rec?.report_urls || [];
                  return (
                    <div className="mb-3">
                      {urls.length > 0 && (
                        <div className="space-y-1 mb-2">
                          {urls.map((url, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded px-2 py-1">
                              <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-indigo-600 hover:underline truncate">
                                <Paperclip className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">Report {idx + 1}</span>
                                <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                              </a>
                              <button onClick={() => handleRemoveAttachment(q.quarter, idx)} className="ml-2 text-slate-400 hover:text-red-500 flex-shrink-0">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-500 hover:text-indigo-600 transition-colors">
                        <Upload className="h-3.5 w-3.5" />
                        {uploading === q.quarter ? "Uploading..." : "Attach report document"}
                        <input type="file" className="hidden" disabled={uploading === q.quarter} onChange={e => handleAttach(q.quarter, e)} />
                      </label>
                    </div>
                  );
                })()}

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => openReport(q)}>
                    <FileText className="h-3.5 w-3.5" /> Generate Report
                  </Button>
                  {status !== "Filed" && (
                    <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-1.5" onClick={() => markFiled.mutate({ quarter: q.quarter, data: { quarter: q.quarter, year, total_revenue: q.totalRevenue, total_taxable_sales: q.taxableSales, total_exempt_sales: q.exemptSales, total_tax_collected: q.taxCollected, tax_due: q.taxCollected } })}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark Filed
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filing Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Filing Report — {selectedQ?.quarter} {year}</DialogTitle>
          </DialogHeader>
          {selectedQ && (
            <div className="space-y-6" id="tax-report-print">
              {/* Header */}
              <div className="border-b border-slate-200 pb-4">
                <h2 className="text-xl font-bold text-slate-900">{businessName}</h2>
                <p className="text-slate-500 text-sm">Sales Tax Filing Support Document</p>
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div><span className="text-slate-400">Reporting Quarter:</span> <strong>{selectedQ.quarter} {year}</strong></div>
                  <div><span className="text-slate-400">Reporting Period:</span> <strong>{selectedQ.name} {year}</strong></div>
                  <div><span className="text-slate-400">Prepared Date:</span> <strong>{format(new Date(), "MMMM d, yyyy")}</strong></div>
                  <div><span className="text-slate-400">Status:</span> <strong>{getStatus(selectedQ.quarter)}</strong></div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Total Gross Sales", fmt(selectedQ.totalRevenue)],
                  ["Total Taxable Sales", fmt(selectedQ.taxableSales)],
                  ["Total Exempt Sales", fmt(selectedQ.exemptSales)],
                  ["Total Tax Collected", fmt(selectedQ.taxCollected)],
                  ["Tax Due", fmt(selectedQ.taxCollected)],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-800">{val}</span>
                  </div>
                ))}
              </div>

              {/* Detailed Transactions */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Transaction Detail</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100">
                      <tr>{["Order ID","Date","Channel","State","Revenue","Tax Rate","Tax Collected","Exempt","Cert #"].map(h => (
                        <th key={h} className="text-left px-2 py-2 font-semibold text-slate-600">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedQ.entries.length === 0 && (
                        <tr><td colSpan={9} className="text-center py-6 text-slate-400">No transactions this quarter.</td></tr>
                      )}
                      {selectedQ.entries.map((e, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-2 py-1.5 font-mono">{e.order_id || "—"}</td>
                          <td className="px-2 py-1.5">{e.order_date ? format(new Date(e.order_date), "MM/dd/yyyy") : "—"}</td>
                          <td className="px-2 py-1.5">{e.sales_channel || "—"}</td>
                          <td className="px-2 py-1.5 font-semibold">{e.state}</td>
                          <td className="px-2 py-1.5">{fmt(e.revenue)}</td>
                          <td className="px-2 py-1.5">{e.tax_rate ? `${e.tax_rate}%` : "—"}</td>
                          <td className="px-2 py-1.5 font-semibold text-emerald-700">{fmt(e.tax_collected)}</td>
                          <td className="px-2 py-1.5">{e.tax_exempt ? "Yes" : "No"}</td>
                          <td className="px-2 py-1.5 font-mono">{e.resale_certificate_number || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setReportOpen(false)}>Close</Button>
                <Button onClick={handlePrint} className="gap-1.5"><Printer className="h-4 w-4" /> Print / Export</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}