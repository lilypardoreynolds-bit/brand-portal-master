import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";

import InvoiceStatsBar from "@/components/wholesale/InvoiceStatsBar";
import InvoiceFormDialog from "@/components/wholesale/InvoiceFormDialog";
import InvoiceViewDialog from "@/components/wholesale/InvoiceViewDialog";
import InvoiceTable from "@/components/wholesale/InvoiceTable";

function padInvoiceNumber(n) {
  return `INV-${String(n).padStart(4, "0")}`;
}

export default function WholesaleInvoices() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: invoices = [] } = useQuery({
    queryKey: ["wholesale_invoices"],
    queryFn: () => base44.entities.WholesaleInvoice.list("-invoice_date"),
    initialData: [],
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["company_profile"],
    queryFn: () => base44.entities.Company.list("-created_date", 1),
    initialData: [],
  });
  const company = companies[0];

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => base44.entities.Inventory.list("product_name"),
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: async (inv) => {
      // Delete items first
      const items = await base44.entities.WholesaleInvoiceItem.filter({ invoice_id: inv.id });
      for (const item of items) {
        await base44.entities.WholesaleInvoiceItem.delete(item.id);
      }
      return base44.entities.WholesaleInvoice.delete(inv.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wholesale_invoices"] }),
  });

  // Auto-deduct inventory when invoice marked Paid/Cancelled
  const deductInventory = async (invoice) => {
    if (invoice.inventory_deducted) return;
    if (!["Paid", "Cancelled"].includes(invoice.status)) return;
    if (invoice.status === "Cancelled") {
      await base44.entities.WholesaleInvoice.update(invoice.id, { inventory_deducted: true });
      return;
    }
    const items = await base44.entities.WholesaleInvoiceItem.filter({ invoice_id: invoice.id });
    for (const item of items) {
      const inv = inventory.find(
        (i) => i.sku === item.sku || i.product_name?.toLowerCase() === item.product_name?.toLowerCase()
      );
      if (inv) {
        const newStock = Math.max(0, (inv.current_stock || 0) - item.quantity);
        await base44.entities.Inventory.update(inv.id, {
          current_stock: newStock,
          last_updated: new Date().toISOString().split("T")[0],
        });
      }
    }
    await base44.entities.WholesaleInvoice.update(invoice.id, { inventory_deducted: true });
    qc.invalidateQueries({ queryKey: ["inventory"] });
  };

  const handleSaved = async () => {
    await qc.invalidateQueries({ queryKey: ["wholesale_invoices"] });
    // Re-fetch and check for inventory deduction
    setTimeout(async () => {
      const fresh = await base44.entities.WholesaleInvoice.list("-invoice_date");
      const target = editingInvoice
        ? fresh.find((i) => i.id === editingInvoice.id)
        : fresh[0];
      if (target) await deductInventory(target);
      qc.invalidateQueries({ queryKey: ["wholesale_invoices"] });
    }, 500);
  };

  const handleExport = (inv) => {
    setViewingInvoice(inv);
  };

  const nextNumber = () => {
    if (invoices.length === 0) return "INV-0001";
    const nums = invoices
      .map((i) => parseInt((i.invoice_number || "").replace("INV-", ""), 10))
      .filter((n) => !isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return padInvoiceNumber(max + 1);
  };

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      !search ||
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.company_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Wholesale Invoices</h2>
          <p className="text-slate-500 text-sm mt-0.5">Generate professional invoices for distributors and wholesale clients.</p>
        </div>
        <Button
          onClick={() => { setEditingInvoice(null); setShowForm(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 gap-1.5"
        >
          <Plus className="h-4 w-4" /> New Invoice
        </Button>
      </div>

      {/* Stats */}
      <InvoiceStatsBar invoices={invoices} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {["Draft", "Sent", "Paid", "Overdue", "Cancelled"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-slate-200">
        <CardContent className="p-0 pt-4">
          <InvoiceTable
            invoices={filtered}
            onView={(inv) => setViewingInvoice(inv)}
            onEdit={(inv) => { setEditingInvoice(inv); setShowForm(true); }}
            onDelete={(inv) => { if (window.confirm(`Delete invoice ${inv.invoice_number}?`)) deleteMutation.mutate(inv); }}
            onExport={handleExport}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <InvoiceFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditingInvoice(null); }}
        onSaved={handleSaved}
        invoice={editingInvoice}
        nextInvoiceNumber={nextNumber()}
      />

      {/* View/PDF Dialog */}
      <InvoiceViewDialog
        open={!!viewingInvoice}
        onClose={() => setViewingInvoice(null)}
        invoice={viewingInvoice}
        company={company}
      />
    </div>
  );
}