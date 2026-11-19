import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";

export default function LedgerFilters({ filters, setFilters, products, categories, counterparties }) {
  const update = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const reset = () => setFilters({ search: "", transaction_type: "all", category: "all", counterparty: "all", date_from: "", date_to: "" });

  return (
    <div className="bg-white border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Filters</p>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-slate-500" onClick={reset}>
          <X className="h-3 w-3" /> Clear
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search description, ref..."
            className="pl-8 h-9 text-sm"
            value={filters.search || ""}
            onChange={(e) => update("search", e.target.value)}
          />
        </div>
        <Select value={filters.transaction_type || "all"} onValueChange={(v) => update("transaction_type", v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="investment">Investment</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="revenue">Revenue</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.category || "all"} onValueChange={(v) => update("category", v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.counterparty || "all"} onValueChange={(v) => update("counterparty", v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Counterparty" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Counterparties</SelectItem>
            {counterparties.map((cp) => (
              <SelectItem key={cp} value={cp}>{cp}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div>
          <Label className="text-[11px] text-slate-500">From</Label>
          <Input type="date" className="h-9 text-sm" value={filters.date_from || ""} onChange={(e) => update("date_from", e.target.value)} />
        </div>
        <div>
          <Label className="text-[11px] text-slate-500">To</Label>
          <Input type="date" className="h-9 text-sm" value={filters.date_to || ""} onChange={(e) => update("date_to", e.target.value)} />
        </div>
      </div>
    </div>
  );
}