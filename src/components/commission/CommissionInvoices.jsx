import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function CommissionInvoices() {
  const queryClient = useQueryClient();
  const [markingPaid, setMarkingPaid] = useState(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["commission_invoices"],
    queryFn: () => base44.entities.CommissionInvoice.list('-issued_date', 50),
    initialData: [],
  });

  const handleMarkPaid = async (invoice) => {
    setMarkingPaid(invoice.id);
    await base44.entities.CommissionInvoice.update(invoice.id, { status: "Paid", paid_date: new Date().toISOString().split("T")[0] });
    await base44.entities.CommissionReport.filter({ reporting_period: invoice.reporting_period }).then(async (reports) => {
      if (reports[0]) await base44.entities.CommissionReport.update(reports[0].id, { status: "Paid" });
    });
    queryClient.invalidateQueries({ queryKey: ["commission_invoices"] });
    queryClient.invalidateQueries({ queryKey: ["commission_reports"] });
    setMarkingPaid(null);
  };

  const statusColors = {
    Draft: "bg-slate-100 text-slate-800",
    Issued: "bg-blue-100 text-blue-800",
    Paid: "bg-green-100 text-green-800",
    Overdue: "bg-red-100 text-red-800",
  };

  const statusIcons = {
    Draft: null,
    Issued: null,
    Paid: <CheckCircle2 className="h-3.5 w-3.5" />,
    Overdue: null,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-slate-500">Loading invoices...</p>
        ) : invoices.length === 0 ? (
          <p className="text-slate-500 text-sm">No commission invoices generated yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-semibold text-slate-600">Invoice #</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-600">Period</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Gross Sales</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Commission</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-600">Due Date</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-600">Status</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono text-xs text-slate-700">{invoice.invoice_number}</td>
                    <td className="py-3 px-3 text-slate-700">{invoice.reporting_period}</td>
                    <td className="py-3 px-3 text-right text-slate-900 font-medium">${invoice.gross_sales?.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right text-green-600 font-bold">${invoice.commission_amount?.toFixed(2)}</td>
                    <td className="py-3 px-3 text-slate-600 text-xs">{format(new Date(invoice.payment_due_date), "MMM d, yy")}</td>
                    <td className="py-3 px-3">
                      <Badge className={statusColors[invoice.status] || "bg-slate-100 text-slate-800"} variant="outline">
                        {statusIcons[invoice.status] && <span className="mr-1">{statusIcons[invoice.status]}</span>}
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {invoice.status !== "Paid" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs border-green-300 text-green-700 hover:bg-green-50"
                          onClick={() => handleMarkPaid(invoice)}
                          disabled={markingPaid === invoice.id}
                        >
                          {markingPaid === invoice.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <CheckCircle2 className="h-3.5 w-3.5" />}
                          Mark as Paid
                        </Button>
                      ) : (
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1 justify-end">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}