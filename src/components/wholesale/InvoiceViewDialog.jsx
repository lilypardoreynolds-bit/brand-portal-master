import React, { useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FileDown, X } from "lucide-react";
import InvoicePDF from "./InvoicePDF";

export default function InvoiceViewDialog({ open, onClose, invoice, company }) {
  const printRef = useRef();

  const { data: items = [] } = useQuery({
    queryKey: ["wholesale_invoice_items", invoice?.id],
    queryFn: () => base44.entities.WholesaleInvoiceItem.filter({ invoice_id: invoice.id }),
    enabled: !!invoice?.id,
    initialData: [],
  });

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Invoice ${invoice?.invoice_number}</title>
      <style>
        body { margin: 0; font-family: Arial, sans-serif; }
        @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
      </style></head>
      <body>${content.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
          <span className="font-semibold text-slate-800">Invoice {invoice.invoice_number}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
              <FileDown className="h-4 w-4" /> Export / Print PDF
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="overflow-auto">
          <InvoicePDF ref={printRef} invoice={invoice} items={items} company={company} />
        </div>
      </DialogContent>
    </Dialog>
  );
}