import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Printer, Eye } from "lucide-react";

export default function OrderItemsDialog({ open, order, orderItems, onClose }) {
  const [view, setView] = useState("items"); // "items" | "packing"

  if (!order) return null;

  const items = (orderItems || []).filter(i => i.order_id === order.id);

  const handlePrint = () => {
    const printContents = document.getElementById("packing-list-print").innerHTML;
    const win = window.open("", "", "width=800,height=600");
    win.document.write(`
      <html><head><title>Packing List - ${order.order_number}</title>
      <style>
        body { font-family: sans-serif; padding: 24px; color: #1e293b; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        h2 { font-size: 14px; color: #64748b; font-weight: 400; margin-top: 0; }
        .header { display: flex; justify-content: space-between; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
        .info { font-size: 13px; line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; padding: 8px; }
        td { padding: 10px 8px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .qty { font-weight: 600; }
        .footer { margin-top: 32px; font-size: 12px; color: #94a3b8; text-align: center; }
      </style></head><body>${printContents}</body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-600" />
            Order {order.order_number}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          <Button
            size="sm"
            variant={view === "items" ? "default" : "outline"}
            onClick={() => setView("items")}
            className="gap-1.5"
          >
            <Eye className="h-3.5 w-3.5" /> Items
          </Button>
          <Button
            size="sm"
            variant={view === "packing" ? "default" : "outline"}
            onClick={() => setView("packing")}
            className="gap-1.5"
          >
            <Package className="h-3.5 w-3.5" /> Packing List
          </Button>
          {view === "packing" && (
            <Button size="sm" variant="ghost" onClick={handlePrint} className="ml-auto gap-1.5">
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
          )}
        </div>

        {view === "items" ? (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div>
                <p className="text-xs text-slate-400 uppercase">Customer</p>
                <p className="font-medium text-slate-700">{order.customer_name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase">Date</p>
                <p className="font-medium text-slate-700">{order.order_date || "—"}</p>
              </div>
            </div>
            {items.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-8">No items in this order.</p>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left">
                      <th className="py-2.5 px-3 font-semibold text-slate-600 text-xs uppercase">Product</th>
                      <th className="py-2.5 px-3 font-semibold text-slate-600 text-xs uppercase text-right">Qty</th>
                      <th className="py-2.5 px-3 font-semibold text-slate-600 text-xs uppercase text-right">Unit Price</th>
                      <th className="py-2.5 px-3 font-semibold text-slate-600 text-xs uppercase text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 text-slate-700">{item.product_name || "—"}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700">{item.quantity || 0}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">${(item.unit_price || 0).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-800">${(item.line_total || ((item.quantity || 0) * (item.unit_price || 0))).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50">
                      <td colSpan={3} className="py-2.5 px-3 text-right font-semibold text-slate-600 text-xs uppercase">Order Total</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">${(order.total || 0).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div id="packing-list-print" className="bg-white">
            <div className="header" style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
              <div>
                <h1 style={{ fontSize: "20px", margin: "0" }}>Packing List</h1>
                <h2 style={{ fontSize: "14px", color: "#64748b", fontWeight: 400, margin: "4px 0 0" }}>{order.order_number}</h2>
              </div>
              <div className="info" style={{ fontSize: "13px", textAlign: "right", lineHeight: 1.6 }}>
                <p><strong>Date:</strong> {order.order_date || "—"}</p>
                <p><strong>Customer:</strong> {order.customer_name || "—"}</p>
                <p><strong>Channel:</strong> {order.sales_channel_name || "—"}</p>
              </div>
            </div>
            {items.length === 0 ? (
              <p style={{ textAlign: "center", color: "#94a3b8", padding: "32px 0" }}>No items in this order.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "#64748b", padding: "8px" }}>Product</th>
                    <th style={{ textAlign: "right", fontSize: "11px", textTransform: "uppercase", color: "#64748b", padding: "8px" }}>Quantity</th>
                    <th style={{ textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "#64748b", padding: "8px" }}>Checked</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 8px", fontSize: "13px" }}>{item.product_name || "—"}</td>
                      <td style={{ padding: "10px 8px", fontSize: "13px", textAlign: "right", fontWeight: 600 }}>{item.quantity || 0}</td>
                      <td style={{ padding: "10px 8px", fontSize: "13px" }}>☐</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="footer" style={{ marginTop: "32px", fontSize: "12px", color: "#94a3b8", textAlign: "center" }}>
              <p>Total items: {items.reduce((s, i) => s + (i.quantity || 0), 0)} • Generated on {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}