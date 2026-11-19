import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ExpenseFilters({ filters, onFilterChange, categories }) {
  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("default", { month: "long", year: "numeric" })
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Select value={filters.month} onValueChange={(v) => onFilterChange({ ...filters, month: v })}>
        <SelectTrigger className="w-40 h-8 text-xs">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Months</SelectItem>
          {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.category} onValueChange={(v) => onFilterChange({ ...filters, category: v })}>
        <SelectTrigger className="w-44 h-8 text-xs">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.expense_type} onValueChange={(v) => onFilterChange({ ...filters, expense_type: v })}>
        <SelectTrigger className="w-32 h-8 text-xs">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="Fixed">Fixed</SelectItem>
          <SelectItem value="Variable">Variable</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.payment_status} onValueChange={(v) => onFilterChange({ ...filters, payment_status: v })}>
        <SelectTrigger className="w-36 h-8 text-xs">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="Paid">Paid</SelectItem>
          <SelectItem value="Pending">Pending</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}