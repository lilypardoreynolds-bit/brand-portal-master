import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import ExpenseSummaryCards from "@/components/expenses/ExpenseSummaryCards";
import ExpenseCategoryBreakdown from "@/components/expenses/ExpenseCategoryBreakdown";
import ExpenseFilters from "@/components/expenses/ExpenseFilters";
import ExpenseTable from "@/components/expenses/ExpenseTable";
import ExpenseFormDialog from "@/components/expenses/ExpenseFormDialog";

const DEFAULT_CATEGORIES = [
  "Inventory Purchase", "Rent", "Phone", "Software / Platforms",
  "Warehouse", "Packaging", "Shipping", "Marketing",
  "Freelancers / Services", "Samples", "Miscellaneous"
];

const QUICK_ADD = [
  "Inventory Purchase", "Rent", "Phone", "Software / Platforms", "Marketing"
];

export default function BrandExpenses() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [quickCategory, setQuickCategory] = useState(null);
  const [filters, setFilters] = useState({
    month: format(new Date(), "yyyy-MM"),
    category: "all",
    expense_type: "all",
    payment_status: "all"
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.Expense.list("-date"),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Expense.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const handleSave = async (formData) => {
    if (editingExpense) {
      await updateMutation.mutateAsync({ id: editingExpense.id, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    setDialogOpen(false);
    setEditingExpense(null);
    setQuickCategory(null);
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setQuickCategory(null);
    setDialogOpen(true);
  };

  const handleQuickAdd = (category) => {
    setEditingExpense(null);
    setQuickCategory(category);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingExpense(null);
    setQuickCategory(null);
  };

  // Summary cards always show current month
  const thisMonth = format(new Date(), "yyyy-MM");
  const monthExpenses = expenses.filter(e => e.date && e.date.startsWith(thisMonth));

  // Table uses filters
  const filteredExpenses = expenses.filter(e => {
    if (filters.month !== "all" && !(e.date || "").startsWith(filters.month)) return false;
    if (filters.category !== "all" && e.category !== filters.category) return false;
    if (filters.expense_type !== "all" && e.expense_type !== filters.expense_type) return false;
    if (filters.payment_status !== "all" && e.payment_status !== filters.payment_status) return false;
    return true;
  });

  // Collect all unique categories (including custom ones)
  const allCategories = Array.from(new Set([
    ...DEFAULT_CATEGORIES,
    ...expenses.map(e => e.category).filter(Boolean).filter(c => !DEFAULT_CATEGORIES.includes(c))
  ]));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Brand Expenses</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track and manage your operational spending</p>
        </div>
        <Button onClick={() => { setEditingExpense(null); setQuickCategory(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </div>

      {/* Summary Cards — always current month */}
      <ExpenseSummaryCards expenses={monthExpenses} />

      {/* Quick Add */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Quick Add</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_ADD.map(cat => (
            <Button key={cat} variant="outline" size="sm" onClick={() => handleQuickAdd(cat)} className="text-xs gap-1.5 h-8">
              <Plus className="h-3 w-3" /> {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Breakdown + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ExpenseCategoryBreakdown expenses={filteredExpenses} />
        <div className="lg:col-span-2 space-y-3">
          <ExpenseFilters filters={filters} onFilterChange={setFilters} categories={allCategories} />
          <ExpenseTable
            expenses={filteredExpenses}
            onEdit={handleEdit}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        </div>
      </div>

      <ExpenseFormDialog
        open={dialogOpen}
        onClose={handleClose}
        onSave={handleSave}
        expense={editingExpense}
        defaultCategory={quickCategory}
        categories={allCategories}
      />
    </div>
  );
}