import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Boxes, Loader2, FileDown } from "lucide-react";
import LedgerKPIs from "@/components/ledger/LedgerKPIs";
import LedgerTable from "@/components/ledger/LedgerTable";
import LedgerTimeline from "@/components/ledger/LedgerTimeline";
import LedgerFilters from "@/components/ledger/LedgerFilters";
import LedgerReports from "@/components/ledger/LedgerReports";
import TransactionFormDialog from "@/components/ledger/TransactionFormDialog";
import { poToLedgerTransactions, costCenterToLedgerTransactions, invoiceRevenueToLedgerTransactions } from "@/lib/ledgerCalc";
import LandedCostBreakdown from "@/components/ledger/LandedCostBreakdown";
import { exportProductLedgerPDF } from "@/lib/exportLedgerPDF";
import { useToast } from "@/components/ui/use-toast";

export default function ProductLedger() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({ search: "", transaction_type: "all", category: "all", counterparty: "all", date_from: "", date_to: "" });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products_for_ledger"],
    queryFn: () => base44.entities.Product.list(),
    initialData: [],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["ledger_categories"],
    queryFn: () => base44.entities.LedgerCategory.list(),
    initialData: [],
  });

  const { data: transactions = [], isLoading: loadingTxns } = useQuery({
    queryKey: ["ledger_transactions", selectedProductId],
    queryFn: () => base44.entities.LedgerTransaction.filter({ product_id: selectedProductId }),
    enabled: !!selectedProductId,
    initialData: [],
  });

  const { data: purchaseOrders = [], isLoading: loadingPOs } = useQuery({
    queryKey: ["po_for_ledger", selectedProductId],
    queryFn: () => base44.entities.PurchaseOrder.list(),
    enabled: !!selectedProductId,
    initialData: [],
  });

  const { data: costCenterEntries = [], isLoading: loadingCC } = useQuery({
    queryKey: ["cost_center_for_ledger", selectedProductId],
    queryFn: () => base44.entities.CostCenter.filter({ product_id: selectedProductId }),
    enabled: !!selectedProductId,
    initialData: [],
  });

  const { data: paidInvoices = [] } = useQuery({
    queryKey: ["paid_invoices_for_ledger", selectedProductId],
    queryFn: () => base44.entities.Invoice.filter({ payment_status: "Paid" }),
    enabled: !!selectedProductId,
    initialData: [],
  });

  const { data: orderItems = [] } = useQuery({
    queryKey: ["order_items_for_ledger", selectedProductId],
    queryFn: () => base44.entities.OrderItem.filter({ product_id: selectedProductId }),
    enabled: !!selectedProductId,
    initialData: [],
  });

  const allTransactions = useMemo(() => {
    const poTxns = poToLedgerTransactions(purchaseOrders, selectedProductId);
    const ccTxns = costCenterToLedgerTransactions(costCenterEntries);
    // Skip invoice revenue already entered by hand (same invoice number) so nothing is counted twice
    const manualRefs = new Set(transactions.filter(t => t.transaction_type === "revenue" && t.reference_number).map(t => t.reference_number));
    const invTxns = invoiceRevenueToLedgerTransactions(paidInvoices, orderItems, selectedProductId)
      .filter(t => !t.reference_number || !manualRefs.has(t.reference_number));
    return [...transactions, ...poTxns, ...ccTxns, ...invTxns];
  }, [transactions, purchaseOrders, costCenterEntries, paidInvoices, orderItems, selectedProductId]);

  const filteredTxns = useMemo(() => {
    return allTransactions.filter((t) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hay = `${t.description || ""} ${t.reference_number || ""} ${t.counterparty || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.transaction_type !== "all" && t.transaction_type !== filters.transaction_type) return false;
      if (filters.category !== "all" && t.category !== filters.category) return false;
      if (filters.counterparty !== "all" && t.counterparty !== filters.counterparty) return false;
      if (filters.date_from && t.date < filters.date_from) return false;
      if (filters.date_to && t.date > filters.date_to) return false;
      return true;
    });
  }, [allTransactions, filters]);

  const counterparties = useMemo(() => {
    const set = new Set();
    allTransactions.forEach((t) => t.counterparty && set.add(t.counterparty));
    return [...set].sort();
  }, [allTransactions]);

  const handleSubmit = async (payload) => {
    if (editing) {
      await base44.entities.LedgerTransaction.update(editing.id, { ...payload, edited_by_name: user?.full_name || "" });
      toast({ title: "Transaction updated" });
    } else {
      await base44.entities.LedgerTransaction.create(payload);
      toast({ title: "Transaction created" });
    }
    queryClient.invalidateQueries({ queryKey: ["ledger_transactions", selectedProductId] });
  };

  const handleDelete = async (txn) => {
    if (!confirm("Delete this transaction? This action is logged.")) return;
    await base44.entities.LedgerTransaction.delete(txn.id);
    queryClient.invalidateQueries({ queryKey: ["ledger_transactions", selectedProductId] });
    toast({ title: "Transaction deleted" });
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportProductLedgerPDF({
        productName: selectedProduct?.name || "Product",
        transactions: allTransactions,
        productId: selectedProductId,
      });
      toast({ title: "PDF report downloaded" });
    } catch (err) {
      toast({ title: "PDF export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header + product selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Financial Ledger</h1>
          <p className="text-sm text-slate-500">Track every dollar invested and earned per SKU</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger className="w-64 h-9"><SelectValue placeholder="Select product..." /></SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="gap-1.5"
            disabled={!selectedProductId || exporting}
            onClick={handleExportPDF}
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Download PDF
          </Button>
          <Button
            className="gap-1.5 bg-[#78AF86] hover:bg-[#5d8f6b]"
            disabled={!selectedProductId}
            onClick={() => { setEditing(null); setShowForm(true); }}
          >
            <Plus className="h-4 w-4" /> Add Transaction
          </Button>
        </div>
      </div>

      {loadingProducts && <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>}

      {!loadingProducts && !selectedProductId && (
        <div className="text-center py-20 border rounded-lg bg-white">
          <Boxes className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Select a product to view its financial ledger.</p>
        </div>
      )}

      {selectedProductId && (
        <>
          {loadingTxns ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : (
            <>
              <LedgerKPIs transactions={filteredTxns} productId={selectedProductId} />
              <LandedCostBreakdown transactions={allTransactions} productId={selectedProductId} />
              {(purchaseOrders.length > 0 || costCenterEntries.length > 0) && (
                <div className="flex items-center gap-3 text-xs text-slate-500 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2">
                  <span className="font-medium text-emerald-700">Live data:</span>
                  <span>{purchaseOrders.filter(p => p.status !== "Draft" && p.status !== "Cancelled").length} Purchase Order(s)</span>
                  <span>•</span>
                  <span>{costCenterEntries.length} Cost Center entr(ies)</span>
                  <span>•</span>
                  <span>{transactions.length} Manual transaction(s)</span>
                </div>
              )}

              <Tabs defaultValue="ledger" className="w-full">
                <TabsList>
                  <TabsTrigger value="ledger">Ledger</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>

                <TabsContent value="ledger" className="space-y-4 mt-4">
                  <LedgerFilters
                    filters={filters}
                    setFilters={setFilters}
                    products={products}
                    categories={categories}
                    counterparties={counterparties}
                  />
                  <LedgerTable
                    transactions={filteredTxns}
                    productId={selectedProductId}
                    onEdit={(t) => { setEditing(t); setShowForm(true); }}
                    onDelete={handleDelete}
                  />
                </TabsContent>

                <TabsContent value="timeline" className="mt-4">
                  <LedgerTimeline transactions={filteredTxns} productId={selectedProductId} />
                </TabsContent>

                <TabsContent value="reports" className="mt-4">
                  <LedgerReports transactions={filteredTxns} productId={selectedProductId} productName={selectedProduct?.name || "Product"} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </>
      )}

      <TransactionFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSubmit={handleSubmit}
        editing={editing}
        products={products}
        categories={categories}
        defaultProductId={selectedProductId}
        currentUser={user}
      />
    </div>
  );
}