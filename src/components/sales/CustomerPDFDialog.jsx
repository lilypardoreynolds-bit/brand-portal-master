import React, { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function CustomerPDFDialog({ open, onClose, customer }) {
  const contentRef = useRef(null);

  const downloadPDF = async () => {
    if (!contentRef.current) return;
    const canvas = await html2canvas(contentRef.current, { scale: 2, useCORS: true });
    const pdf = new jsPDF("p", "mm", "a4");
    const imgData = canvas.toDataURL("image/png");
    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let yOffset = 0;
    let remainingHeight = imgHeight;
    while (remainingHeight > 0) {
      pdf.addImage(imgData, "PNG", 0, -yOffset, imgWidth, imgHeight);
      remainingHeight -= pageHeight;
      yOffset += pageHeight;
      if (remainingHeight > 0) pdf.addPage();
    }
    pdf.save(`customer-${(customer?.customer_name || "profile").replace(/\s+/g, "-")}.pdf`);
  };

  if (!customer) return null;

  const Row = ({ label, value }) =>
    value ? (
      <div className="flex py-2 border-b border-slate-100 text-sm">
        <span className="w-48 font-semibold text-slate-500">{label}</span>
        <span className="text-slate-900">{value}</span>
      </div>
    ) : null;

  const billingAddress = [customer.address, customer.city, customer.state, customer.zip_code, customer.country]
    .filter(Boolean).join(", ");
  const shippingAddress = [customer.ship_to_address, customer.ship_to_city, customer.ship_to_state, customer.ship_to_zip, customer.ship_to_country]
    .filter(Boolean).join(", ");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between pb-4">
          <DialogTitle>Customer Profile</DialogTitle>
          <Button size="sm" onClick={downloadPDF} className="gap-2">
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </DialogHeader>

        <div ref={contentRef} className="bg-white p-10 text-slate-900 font-sans text-[12px]">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <h1 className="text-3xl font-bold">{customer.customer_name}</h1>
            {customer.company_name && <p className="text-lg text-slate-600 mt-1">{customer.company_name}</p>}
            <span className="inline-block mt-2 text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
              {customer.customer_type || "Customer"}
            </span>
            {customer.tax_exempt && (
              <span className="inline-block mt-2 ml-2 text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full">
                Tax Exempt
              </span>
            )}
          </div>

          {/* Contact Info */}
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Contact Information</h2>
            <Row label="Email" value={customer.email} />
            <Row label="Phone" value={customer.phone} />
          </div>

          {/* Billing Address */}
          {billingAddress && (
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Billing Address</h2>
              <Row label="Address" value={customer.address} />
              <Row label="City" value={customer.city} />
              <Row label="State" value={customer.state} />
              <Row label="ZIP Code" value={customer.zip_code} />
              <Row label="Country" value={customer.country} />
            </div>
          )}

          {/* Shipping Address */}
          {shippingAddress && (
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Shipping Address</h2>
              <Row label="Address" value={customer.ship_to_address} />
              <Row label="City" value={customer.ship_to_city} />
              <Row label="State" value={customer.ship_to_state} />
              <Row label="ZIP Code" value={customer.ship_to_zip} />
              <Row label="Country" value={customer.ship_to_country} />
            </div>
          )}

          {/* Tax Exempt Details */}
          {customer.tax_exempt && (
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Tax Exemption</h2>
              <Row label="Certificate Number" value={customer.tax_exempt_certificate} />
              <Row label="Expiry Date" value={customer.tax_exempt_expiry} />
            </div>
          )}

          {/* Notes */}
          {customer.notes && (
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Notes</h2>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}

          <div className="text-right text-xs text-slate-400 mt-8 pt-4 border-t border-slate-200">
            Exported on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}