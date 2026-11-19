import React, { useRef, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { base44 } from "@/api/base44Client";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function InvoicePDFDialog({ open, onClose, invoice }) {
  const contentRef = useRef(null);
  const [company, setCompany] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [lineItems, setLineItems] = useState([]);

  useEffect(() => {
    if (!open || !invoice) return;
    const loadData = async () => {
      try {
        const comp = await base44.entities.Company.list().then(c => c[0]);
        setCompany(comp);
        if (invoice.customer_id && invoice.id) {
          const cust = await base44.entities.Customer.get(invoice.customer_id);
          setCustomer(cust);
        }
        if (invoice.order_id) {
          const items = await base44.entities.OrderItem.filter({ order_id: invoice.order_id });
          const itemsWithProducts = await Promise.all(
            items.map(async (item) => {
              if (item.product_id) {
                const product = await base44.entities.Product.get(item.product_id);
                return { ...item, barcode: product.sku };
              }
              return item;
            })
          );
          setLineItems(itemsWithProducts);
        }
      } catch (err) {
        console.error("Failed to load invoice data:", err);
      }
    };
    loadData();
  }, [open, invoice]);

  const downloadPDF = async () => {
    if (!contentRef.current) return;
    try {
      const canvas = await html2canvas(contentRef.current, { scale: 1.5, useCORS: true });
      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      // Add clickable payment link on top of the image
      if (invoice.payment_link) {
        // The payment link box is near the bottom — estimate its position
        const pageHeight = 297; // A4 mm height
        const contentHeightMM = imgHeight;
        // Approximate y position: payment link is roughly 84% down the content
        const linkY = Math.min(contentHeightMM * 0.84, pageHeight - 20);
        const linkX = 65;
        const linkWidth = 80;
        const linkHeight = 10;
        pdf.link(linkX, linkY, linkWidth, linkHeight, { url: invoice.payment_link });
      }

      pdf.save(`${invoice.invoice_number || "invoice"}.pdf`);
    } catch (error) {
      console.error("PDF download failed:", error);
    }
  };

  if (!invoice || !company) return null;

  const dueDate = new Date(invoice.invoice_date);
  dueDate.setDate(dueDate.getDate() + 1);
  const dueDateStr = dueDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const invoiceDateFormatted = new Date(invoice.invoice_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const isTaxExempt = customer?.tax_exempt || false;
  const subtotal = invoice.subtotal || 0;
  const discount = invoice.discount || 0;
  const taxAmount = invoice.tax || 0;
  const total = invoice.total_amount || (subtotal - discount + taxAmount);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between pb-4">
          <DialogTitle>Invoice {invoice.invoice_number}</DialogTitle>
          <Button size="sm" onClick={downloadPDF} className="gap-2">
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </DialogHeader>

        <div ref={contentRef} className="bg-white p-6 text-slate-900 text-xs font-sans" style={{fontSize: "11px", lineHeight: "1.4"}}>
          {/* Header with Logo and Title */}
          <div className="flex justify-between items-start mb-8">
            <div>
              {company.logo_url && <img src={company.logo_url} alt={company.brand_name} className="h-20 mb-2" />}
              <h1 className="text-2xl font-bold">Invoice</h1>
            </div>
            <div className="text-right text-xs leading-relaxed">
              <p><span className="font-semibold">Invoice number</span> {invoice.invoice_number}</p>
              <p><span className="font-semibold">Date of issue</span> {invoiceDateFormatted}</p>
              <p><span className="font-semibold">Date due</span> {dueDateStr}</p>
            </div>
          </div>

          {/* Sender, Bill To, Ship To */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Sender */}
            <div className="text-xs leading-relaxed">
              <p className="font-bold">{company.brand_name || company.company_name}</p>
              <p>{company.business_address}</p>
              {company.state_of_registration && <p>{company.state_of_registration}</p>}
              {company.country && <p>{company.country}</p>}
              {company.phone_number && <p>{company.phone_number}</p>}
              {company.email && <p>{company.email}</p>}
            </div>

            {/* Bill To */}
            <div className="text-xs leading-relaxed">
              <p className="font-bold">Bill to</p>
              <p className="font-semibold">{invoice.customer_name}</p>
              {invoice.company_name && <p className="font-semibold">{invoice.company_name}</p>}
              {customer?.address && <p>{customer.address}</p>}
              {customer?.city && <p>{customer.city}, {customer.state} {customer.zip_code}</p>}
              {customer?.country && <p>{customer.country}</p>}
              {customer?.email && <p>{customer.email}</p>}
            </div>

            {/* Ship To */}
            <div className="text-xs leading-relaxed">
              <p className="font-bold">Ship to</p>
              <p className="font-semibold">{invoice.ship_to_name || invoice.customer_name}</p>
              {(invoice.ship_to_address || customer?.ship_to_address) && <p>{invoice.ship_to_address || customer?.ship_to_address}</p>}
              {(invoice.ship_to_city || customer?.ship_to_city) && <p>{invoice.ship_to_city || customer?.ship_to_city}{invoice.ship_to_state || customer?.ship_to_state ? `, ${invoice.ship_to_state || customer?.ship_to_state}` : ""} {invoice.ship_to_zip || customer?.ship_to_zip}</p>}
              {(invoice.ship_to_country || customer?.ship_to_country) && <p>{invoice.ship_to_country || customer?.ship_to_country}</p>}
            </div>
          </div>

          {/* Amount Due Summary */}
          <div className="mb-8 pb-4 border-b-2 border-slate-900">
            <p className="text-sm font-bold">
              ${total.toFixed(2)} USD due {dueDateStr}
            </p>
          </div>

          {/* Seller Info */}
          <div className="mb-8 text-xs leading-relaxed text-slate-700">
            <p><span className="font-semibold">Seller:</span> {company.brand_name || company.company_name}</p>
            <p><span className="font-semibold">Address:</span> {company.business_address}{company.state_of_registration ? `, ${company.state_of_registration}` : ""} {company.country}</p>
            {company.phone_number && <p><span className="font-semibold">Phone:</span> {company.phone_number}</p>}
            <p><span className="font-semibold">Email:</span> contact@ujoysolutions.com</p>
            {company.website && <p><span className="font-semibold">Website:</span> {company.website}</p>}
          </div>

          {/* Line Items Table */}
          {lineItems.length > 0 && (
            <div className="mb-8">
              <table className="w-full text-xs mb-4">
                <thead>
                  <tr className="border-b border-slate-300">
                    <th className="text-left py-2 font-bold w-24">UPC</th>
                    <th className="text-left py-2 font-bold">Description</th>
                    <th className="text-center py-2 font-bold w-16">Qty</th>
                    <th className="text-right py-2 font-bold w-20">Unit price<br />(excl. tax)</th>
                    <th className="text-right py-2 font-bold w-20">Amount<br />(excl. tax)</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="py-3">{item.barcode || "-"}</td>
                      <td className="py-3">{item.product_name}</td>
                      <td className="text-center py-3">{item.quantity}</td>
                      <td className="text-right py-3">${(item.unit_price || 0).toFixed(2)}</td>
                      <td className="text-right py-3">${((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-56">
              <div className="flex justify-between text-xs py-2 border-t border-slate-300">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-xs py-2 text-green-700">
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-xs py-2">
                  <span>Tax</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
              )}
              {isTaxExempt && (
                <div className="text-xs text-slate-500 py-1">✓ Tax-exempt</div>
              )}
              <div className="flex justify-between text-xs py-2 border-b border-slate-300">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold py-2">
                <span>Amount due</span>
                <span>${total.toFixed(2)} USD</span>
              </div>

            </div>
          </div>

          {/* Payment Link */}
          {invoice.payment_link && (
            <div className="bg-indigo-50 border-2 border-indigo-600 rounded-lg p-4 mt-8 text-center">
              <p className="text-xs text-indigo-600 mb-2 font-semibold">PAYMENT LINK</p>
              <a href={invoice.payment_link} target="_blank" rel="noreferrer" className="inline-block bg-indigo-600 text-white font-bold text-sm px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                PAY ONLINE
              </a>
            </div>
          )}

          {/* Disclaimer */}
          <div className="text-xs text-slate-700 mt-8 pt-4 border-t border-slate-200">
            <p>U Joy Solutions Corp is the brand owner and authorized distributor of the products listed above. All goods are authentic and manufactured by an approved facility in compliance with industry standards. This invoice reflects a legitimate B2B transaction.</p>
          </div>

          {/* Footer Notes */}
          {invoice.notes && (
            <div className="text-xs text-slate-600 mt-4">
              <p>{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-right text-xs text-slate-400 mt-8">
            <p>Page 1 of 1</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}