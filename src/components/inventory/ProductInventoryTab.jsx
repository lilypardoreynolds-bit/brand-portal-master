import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Plus, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";
import MovementFormDialog from "./MovementFormDialog";
import MovementsTable from "./MovementsTable";

export default function ProductInventoryTab({ productId, productName }) {
  const qc = useQueryClient();
  const [movDialog, setMovDialog] = useState(false);

  const { data: inventoryList = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => base44.entities.Inventory.list("product_name"),
    initialData: [],
  });

  const { data: movements = [] } = useQuery({
    queryKey: ["inventory_movements"],
    queryFn: () => base44.entities.InventoryMovement.list("-date"),
    initialData: [],
  });

  const invItem = inventoryList.find(i => i.product_id === productId);
  const productMovements = movements.filter(m => m.product_id === productId);

  const saveMovement = useMutation({
    mutationFn: async (form) => {
      await base44.entities.InventoryMovement.create(form);
      if (!invItem) return;
      let newStock = invItem.current_stock || 0;
      const qty = Number(form.quantity);
      if (form.movement_type === "Inbound") newStock += qty;
      else if (form.movement_type === "Outbound") newStock = Math.max(0, newStock - qty);
      else newStock = qty;
      return base44.entities.Inventory.update(invItem.id, {
        current_stock: newStock,
        last_updated: new Date().toISOString().split("T")[0]
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["inventory_movements"] });
    },
  });

  const createInventory = useMutation({
    mutationFn: () => base44.entities.Inventory.create({
      product_id: productId,
      product_name: productName,
      current_stock: 0,
      min_stock_level: 0,
      max_stock_level: 0,
      unit_cost: 0,
      last_updated: new Date().toISOString().split("T")[0]
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });

  if (!invItem) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="bg-slate-100 rounded-full p-4 mb-3">
          <ArrowUpDown className="h-7 w-7 text-slate-400" />
        </div>
        <p className="text-slate-600 font-medium">Not tracked in inventory</p>
        <p className="text-sm text-slate-400 mt-1">Add this product to inventory to track stock levels</p>
        <Button onClick={() => createInventory.mutate()} className="mt-4 bg-indigo-600 hover:bg-indigo-700 gap-2">
          <Plus className="h-4 w-4" /> Add to Inventory
        </Button>
      </div>
    );
  }

  const value = (invItem.current_stock || 0) * (invItem.unit_cost || 0);
  const isOutOfStock = invItem.current_stock <= 0;
  const isLowStock = !isOutOfStock && invItem.min_stock_level > 0 && invItem.current_stock <= invItem.min_stock_level;

  return (
    <div className="space-y-6 pt-2">
      {/* Stock summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-3xl font-bold text-slate-900">{invItem.current_stock ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">Current Stock</p>
          <div className="mt-2 flex justify-center">
            {isOutOfStock
              ? <span className="flex items-center gap-1 text-xs text-red-600"><XCircle className="h-3.5 w-3.5" />Out of Stock</span>
              : isLowStock
              ? <span className="flex items-center gap-1 text-xs text-amber-600"><AlertTriangle className="h-3.5 w-3.5" />Low Stock</span>
              : <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3.5 w-3.5" />In Stock</span>
            }
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-3xl font-bold text-slate-900">${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-500 mt-1">Inventory Value</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-3xl font-bold text-slate-900">{invItem.min_stock_level ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">Min Level</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-slate-500 text-sm">{invItem.warehouse_location || "—"}</p>
          <p className="text-xs text-slate-400 mt-1">Location</p>
        </div>
      </div>

      {/* Movements */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-700 text-sm">Stock Movements</h3>
          <Button size="sm" variant="outline" onClick={() => setMovDialog(true)} className="gap-2">
            <ArrowUpDown className="h-3.5 w-3.5" /> Record Movement
          </Button>
        </div>
        <MovementsTable movements={productMovements} limit={20} />
      </div>

      <MovementFormDialog
        open={movDialog}
        inventory={inventoryList}
        defaultInventoryId={invItem.id}
        onClose={() => setMovDialog(false)}
        onSave={form => saveMovement.mutateAsync(form)}
      />
    </div>
  );
}