import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Boxes, Loader2, Calculator } from "lucide-react";
import { format } from "date-fns";
import CostCenterFormDialog from "@/components/ledger/CostCenterFormDialog";
import { useToast } from "@/components/ui/use-toast";

function fmtMoney(n) {
  const v = Number(n) || 0;
  return (v < 0 ? "-$" : "$") + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CostCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products_for_cost_center"],
    queryFn: () => base44.entities.Product.list(),
    initialData: [],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["ledger_categories"],
    queryFn: () => base44.entities.LedgerCategory.list(),
    initialData: [],
  });

  const { data: costEntries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ["cost_center_entries", selectedProductId],
    queryFn: () => base44.entities.CostCenter.filter({ product_id: selectedProductId }),
    enabled: !!selectedProductId,
    initialData: [],
  });

  const summary = useMemo(() => {
    let investment = 0, expense = 0;
    const byCategory = {};
    for (const e of costEntries) {
      const amt = Number(e.amount) || 0;
      if (e.transaction_type === "expense") expense += amt;
      else investment += amt;
      byCategory[e.category] = (byCategory[e.category] || 0) + amt;
    }
    return { investment, expense, total: investment + expense, byCategory };
  }, [costEntries]);

  const handleSubmit = async (payload) => {
    if (editing) {
      await base44.entities.CostCenter.update(editing.id, payload);
      toast({ title: "Cost entry updated" });
    } else {
      await base44.entities.CostCenter.create(payload);
      toast({ title: "Cost entry created" });
    }
    queryClient.invalidateQueries({ queryKey: ["cost_center_entries", selectedProductId] });
    queryClient.invalidateQueries({ queryKey: ["cost_center_for_ledger", selectedProductId] });
  };

  const handleDelete = async (entry) => {
    if (!confirm("Delete this cost entry?")) return;
    await base44.entities.CostCenter.delete(entry.id);
    queryClient.invalidateQueries({ queryKey: ["cost_center_entries", selectedProductId] });
    queryClient.invalidateQueries({ queryKey: ["cost_center_for_ledger", selectedProductId] });
    toast({ title: "Cost entry deleted" });
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cost Center</h1>
          <p className="text-sm text-slate-500">Track all product costs — feeds into Product Financial Ledger</p>
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
          <Button className="gap-1.5 bg-[#78AF86] hover:bg-[#5d8f6b]" disabled={!selectedProductId} onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus className="h-4 w-4" /> Add Cost
          </Button>
        </div>
      </div>

      {loadingProducts && <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>}

      {!loadingProducts && !selectedProductId && (
        <div className="text-center py-20 border rounded-lg bg-white">
          <Calculator className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Select a product to manage its cost center entries.</p>
        </div>
      )}

      {selectedProductId && (
        <>
          {loadingEntries ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="border-slate-200"><CardContent className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Total Investment Costs</p>
                  <p className="text-xl font-bold text-slate-900">{fmtMoney(summary.investment)}</p>
                </CardContent></Card>
                <Card className="border-slate-200"><CardContent className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Total Operating Expenses</p>
                  <p className="text-xl font-bold text-slate-900">{fmtMoney(summary.expense)}</p>
                </CardContent></Card>
                <Card className="border-slate-200"><CardContent className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Grand Total</p>
                  <p className="text-xl font-bold text-[#78AF86]">{fmtMoney(summary.total)}</p>
                </CardContent></Card>
              </div>

              <div className="bg-white border rounded-lg overflow-hidden">
                {costEntries.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Boxes className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    No cost entries yet. Click "Add Cost" to create one.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-28">Date</TableHead>
                        <TableHead className="w-28">Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>PO #</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Cost</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costEntries.map((entry) => (
                        <TableRow key={entry.id} className="hover:bg-slate-50">
                          <TableCell className="whitespace-nowrap text-xs text-slate-600">
                            {entry.date ? format(new Date(entry.date), "MMM d, yyyy") : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge className={entry.transaction_type === "expense" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}>
                              {entry.transaction_type === "expense" ? "Expense" : "Investment"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-medium text-slate-700">{entry.category}</TableCell>
                          <TableCell className="text-xs text-slate-600">{entry.supplier || "—"}</TableCell>
                          <TableCell className="text-xs text-slate-600">{entry.po_number || "—"}</TableCell>
                          <TableCell className="text-xs text-slate-600 max-w-[200px] truncate">{entry.description || "—"}</TableCell>
                          <TableCell className="text-right text-xs">{entry.quantity || "—"}</TableCell>
                          <TableCell className="text-right text-xs">{entry.unit_cost ? fmtMoney(entry.unit_cost) : "—"}</TableCell>
                          <TableCell className="text-right font-semibold text-sm text-slate-900">{fmtMoney(entry.amount)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(entry); setShowForm(true); }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500" onClick={() => handleDelete(entry)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </>
          )}
        </>
      )}

      <CostCenterFormDialog
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