import React, { useRef, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const PAYMENT_METHOD_LABELS = {
  transfer: "Bank Transfer / Wise",
  card: "Credit / Debit Card",
  cash: "Cash",
  check: "Check",
  other: "Other",
};

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between border-b border-slate-100 pb-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-right">{value}</span>
    </div>
  );
}

export default function PaymentReceiptDialog({ open, onClose, invoice }) {
  const contentRef = useRef(null);
  const [company, setCompany] = useState(null);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    if (!open || !invoice) return;
    base44.entities.Company.list().then(c => setCompany(c[0]));
    if (invoice.customer_id) {
      base44.entities.Customer.filter({ id: invoice.customer_id }).then(res => {
        if (res && res.length > 0) setCustomer(res[0]);
      });
    }
  }, [open, invoice]);

  const downloadPDF = async () => {
    if (!contentRef.current) return;
    const canvas = await html2canvas(contentRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pdf = new jsPDF("p", "mm", [imgWidth, imgHeight]);
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(`receipt-${invoice.invoice_number}.pdf`);
  };

  if (!invoice || !company) return null;

  const paymentDate = invoice.payment_date
    ? new Date(invoice.payment_date + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  const invoiceDate = invoice.invoice_date
    ? new Date(invoice.invoice_date + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  const shipToLines = [
    invoice.ship_to_address,
    [invoice.ship_to_city, invoice.ship_to_state, invoice.ship_to_zip].filter(Boolean).join(", "),
    invoice.ship_to_country,
  ].filter(Boolean);

  const companyAddressLines = [
    company.business_address,
    [company.business_city, company.business_state, company.business_zip].filter(Boolean).join(", "),
    company.country,
  ].filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between pb-2">
          <DialogTitle>Payment Receipt — {invoice.invoice_number}</DialogTitle>
          <Button size="sm" onClick={downloadPDF} className="gap-2 mr-6">
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </DialogHeader>

        <div ref={contentRef} className="bg-white p-8 text-slate-900 text-sm font-sans">

          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              {company.logo_url && <img src={company.logo_url} alt={company.brand_name} className="h-16 mb-3" />}
              <h1 className="text-3xl font-bold text-green-700">Payment Receipt</h1>
            </div>
            <div className="text-right text-xs leading-relaxed space-y-1">
              <p><span className="font-semibold">Invoice #:</span> {invoice.invoice_number}</p>
              <p><span className="font-semibold">Invoice Date:</span> {invoiceDate}</p>
              {invoice.order_number && <p><span className="font-semibold">Order #:</span> {invoice.order_number}</p>}
              <p className="mt-2 inline-block bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-sm">✓ PAID</p>
            </div>
          </div>

          {/* From U-Joy / To Customer */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Company (U-Joy) */}
            <div className="text-xs leading-relaxed">
              <p className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mb-2">From</p>
              <p className="font-bold text-base">{company.brand_name || company.company_name}</p>
              {company.company_name !== company.brand_name && company.company_name && (
                <p className="text-slate-500">{company.company_name}</p>
              )}
              {companyAddressLines.map((l, i) => <p key={i}>{l}</p>)}
              {company.phone_number && <p>{company.phone_number}</p>}
              {company.email && <p>{company.email}</p>}
              {company.website && <p>{company.website}</p>}

            </div>

            {/* Customer */}
            <div className="text-xs leading-relaxed">
              <p className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mb-2">Received From</p>
              <p className="font-bold text-base">{customer?.customer_name || invoice.ship_to_name || invoice.customer_name}</p>
              {(customer?.company_name || invoice.company_name) && (
                <p className="text-slate-500">{customer?.company_name || invoice.company_name}</p>
              )}
              {/* Billing address */}
              {customer?.address && <p>{customer.address}</p>}
              {(customer?.city || customer?.state || customer?.zip_code) && (
                <p>{[customer.city, customer.state, customer.zip_code].filter(Boolean).join(", ")}</p>
              )}
              {customer?.country && <p>{customer.country}</p>}
              {/* Shipping address (if different) */}
              {customer?.ship_to_address && customer.ship_to_address !== customer.address && (
                <>
                  <p className="font-semibold mt-2">Ship to:</p>
                  <p>{customer.ship_to_address}</p>
                  {(customer.ship_to_city || customer.ship_to_state || customer.ship_to_zip) && (
                    <p>{[customer.ship_to_city, customer.ship_to_state, customer.ship_to_zip].filter(Boolean).join(", ")}</p>
                  )}
                  {customer.ship_to_country && <p>{customer.ship_to_country}</p>}
                </>
              )}
              {customer?.email && <p className="mt-1">{customer.email}</p>}
              {customer?.phone && <p>{customer.phone}</p>}
              {customer?.customer_type && <p className="text-slate-400 mt-1">{customer.customer_type}</p>}
              {customer?.tax_exempt && customer?.tax_exempt_certificate && (
                <p className="text-slate-400">Tax Exempt: {customer.tax_exempt_certificate}</p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-green-600 mb-6" />

          {/* Transaction Details */}
          <div className="mb-8">
            <p className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-widest">Transaction Details</p>
            <div className="space-y-2">
              <Row label="Received On" value={paymentDate} />
              <Row label="Payment Method" value={PAYMENT_METHOD_LABELS[invoice.payment_method] || invoice.payment_method} />
              <Row label="Reference #" value={invoice.payment_reference} />
              <Row label="Transaction #" value={invoice.payment_transaction_number} />
            </div>
          </div>

          {/* Amount Summary */}
          <div className="mb-8">
            <p className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-widest">Payment Summary</p>
            <div className="space-y-2">
              {invoice.subtotal > 0 && <Row label="Subtotal" value={`$${(invoice.subtotal || 0).toFixed(2)} USD`} />}
              {invoice.tax > 0 && <Row label="Tax" value={`$${(invoice.tax || 0).toFixed(2)} USD`} />}
              <div className="flex justify-between pt-2 mt-1 border-t border-slate-200">
                <span className="font-bold text-green-700 text-base">Total Received</span>
                <span className="font-bold text-green-700 text-xl">${(invoice.total_amount || 0).toFixed(2)} USD</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-4 text-xs text-slate-400 text-center">
            <p>This receipt confirms full payment of invoice <strong>{invoice.invoice_number}</strong>.</p>
            <p className="mt-1">{company.brand_name || company.company_name} — {company.email || ""}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}