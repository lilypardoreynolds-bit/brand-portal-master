import React, { useState } from "react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Paperclip } from "lucide-react";
import { buildLedgerRows, TX_TYPE_LABELS, TX_TYPE_COLORS } from "@/lib/ledgerCalc";

function fmtMoney(n) {
  const v = Number(n) || 0;
  return (v < 0 ? "-$" : "$") + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function LedgerTable({ transactions, productId, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(null);
  const rows = buildLedgerRows(transactions, productId);

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 border rounded-lg bg-white">
        No transactions yet. Click "Add Transaction" to create the first ledger entry.
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="w-28">Date</TableHead>
            <TableHead className="w-28">Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit Cost</TableHead>
            <TableHead className="text-right">In (+)</TableHead>
            <TableHead className="text-right">Out (-)</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <React.Fragment key={row.id}>
              <TableRow className="hover:bg-slate-50">
                <TableCell className="whitespace-nowrap text-xs text-slate-600">
                  {row.date ? format(new Date(row.date), "MMM d, yyyy") : "—"}
                </TableCell>
                <TableCell>
                  <Badge className={TX_TYPE_COLORS[row.transaction_type]}>
                    {TX_TYPE_LABELS[row.transaction_type]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm font-medium text-slate-700">
                  {row.category}
                  {row._source && (
                    <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium align-middle">
                      {row._source === "purchase_order" ? "PO" : "CC"}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-slate-600">{row.counterparty || "—"}</TableCell>
                <TableCell className="text-xs text-slate-600 max-w-[200px] truncate">{row.description || "—"}</TableCell>
                <TableCell className="text-right text-xs">{row.quantity || "—"}</TableCell>
                <TableCell className="text-right text-xs">{row.unit_cost ? fmtMoney(row.unit_cost) : "—"}</TableCell>
                <TableCell className="text-right text-emerald-700 font-medium text-xs">{row._inflow ? fmtMoney(row._inflow) : ""}</TableCell>
                <TableCell className="text-right text-rose-600 font-medium text-xs">{row._outflow ? fmtMoney(row._outflow) : ""}</TableCell>
                <TableCell className={`text-right font-semibold text-xs ${row._balance >= 0 ? "text-slate-900" : "text-rose-600"}`}>
                  {fmtMoney(row._balance)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {row.attachment_urls?.length > 0 && (
                      <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                    )}
                    {onEdit && !row._source && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(row)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {onDelete && !row._source && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500" onClick={() => onDelete(row)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
              {(row.reference_number || row.notes || row.attachment_urls?.length > 0 || row.allocations?.length > 0) && (
                <TableRow className="bg-slate-50/50">
                  <TableCell colSpan={11} className="py-2 px-4">
                    <div className="flex flex-wrap gap-4 text-[11px] text-slate-500">
                      {row.reference_number && <span><strong className="text-slate-400">Ref:</strong> {row.reference_number}</span>}
                      {row.notes && <span className="max-w-md"><strong className="text-slate-400">Notes:</strong> {row.notes}</span>}
                      {row.attachment_urls?.length > 0 && (
                        <span className="flex gap-2">
                          {row.attachment_urls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                              Attachment {i + 1}
                            </a>
                          ))}
                        </span>
                      )}
                      {row.allocations?.length > 0 && (
                        <span><strong className="text-slate-400">Split:</strong> {row.allocations.length} products</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}