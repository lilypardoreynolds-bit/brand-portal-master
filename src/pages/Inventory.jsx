import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, ArrowUpDown, Package, PackageX, RefreshCw, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import InventoryStatsBar from "@/components/inventory/InventoryStatsBar";
import LowStockAlerts from "@/components/inventory/LowStockAlerts";
import InventoryTable from "@/components/inventory/InventoryTable";
import InventoryFormDialog from "@/components/inventory/InventoryFormDialog";
import MovementFormDialog from "@/components/inventory/MovementFormDialog";
import MovementsTable from "@/components/inventory/MovementsTable";
import TransferDialog from "@/components/inventory/TransferDialog";
import ConsumptionFormDialog from "@/components/inventory/ConsumptionFormDialog";
import ConsumptionTable from "@/components/inventory/ConsumptionTable";
import { useAppSettings } from "@/lib/appSettings";
import { recordConsumption } from "@/lib/recordConsumption";
import { useAuth } from "@/lib/AuthContext";

export default function InventoryPage() {
  const isAdmin = useIsAdmin();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [invDialog, setInvDialog] = useState({ open: false, item: null });
  const [movDialog, setMovDialog] = useState({ open: false, inventoryId: null });
  const [transferDialog, setTransferDialog] = useState({ open: false, sourceItem: null });
  const [recalculating, setRecalculating] = useState(false);
  const [consumeDialog, setConsumeDialog] = useState(false);
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const { warehouses } = useAppSettings();
  const { user } = useAuth();

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => base44.entities.Inventory.list("product_name"),
    initialData: [],
  });

  const { data: movements = [] } = useQuery({
    queryKey: ["inventory_movements"],
    queryFn: () => base44.entities.InventoryMovement.list("-date"),
    initialData: [],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.filter({ status: "active" }),
    initialData: [],
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => base44.entities.Supplier.list("supplier_name"),
    initialData: [],
  });

  const { data: consumptions = [] } = useQuery({
    queryKey: ["inventory_consumptions"],
    queryFn: () => base44.entities.InventoryConsumption.list("-date"),
    initialData: [],
  });

  const saveInventory = useMutation({
    mutationFn: async (form) => {
      if (form.id) { const { id, ...rest } = form; return base44.entities.Inventory.update(id, rest); }
      return base44.entities.Inventory.create(form);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });

  const deleteInventory = useMutation({
    mutationFn: id => base44.entities.Inventory.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });

  const saveMovement = useMutation({
    mutationFn: async (form) => {
      await base44.entities.InventoryMovement.create(form);
      const invItem = inventory.find(i => i.id === form.inventory_id);
      if (!invItem) return;
      const currentOnHand = invItem.on_hand ?? invItem.current_stock ?? 0;
      const qty = Number(form.quantity);
      let newOnHand;
      if (form.movement_type === "Inbound") newOnHand = currentOnHand + qty;
      else if (form.movement_type === "Outbound") newOnHand = Math.max(0, currentOnHand - qty);
      else newOnHand = qty; // Adjustment: set exact value
      const reserved = invItem.reserved ?? 0;
      const available = Math.max(0, newOnHand - reserved);
      return base44.entities.Inventory.update(invItem.id, {
        on_hand: newOnHand,
        current_stock: newOnHand,
        available,
        last_updated: new Date().toISOString().split("T")[0],
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["inventory_movements"] });
    },
  });

  const deleteMovement = useMutation({
    mutationFn: id => base44.entities.InventoryMovement.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory_movements"] }),
  });

  const doTransfer = useMutation({
    mutationFn: async (form) => {
      const today = new Date().toISOString().split("T")[0];
      const { items, toWarehouse, reference, notes } = form;

      for (const item of items) {
        const qty = Number(item.quantity);
        const sourceItem = inventory.find(i => i.id === item.product_id);
        if (!sourceItem) throw new Error(`Source inventory not found for product ${item.product_id}`);

        // 1. Deduct from source (Own Warehouse)
        const srcOnHand = Math.max(0, (sourceItem.on_hand ?? sourceItem.current_stock ?? 0) - qty);
        const srcReserved = sourceItem.reserved ?? 0;
        const srcAvailable = Math.max(0, srcOnHand - srcReserved);
        await base44.entities.Inventory.update(sourceItem.id, {
          on_hand: srcOnHand,
          current_stock: srcOnHand,
          available: srcAvailable,
          last_updated: today,
        });

        // 2. Find or create destination inventory record
        const destExisting = inventory.find(
          i => i.product_id === sourceItem.product_id && i.warehouse === toWarehouse
        );
        let destId;
        if (destExisting) {
          const destOnHand = (destExisting.on_hand ?? destExisting.current_stock ?? 0) + qty;
          const destReserved = destExisting.reserved ?? 0;
          const destAvailable = Math.max(0, destOnHand - destReserved);
          await base44.entities.Inventory.update(destExisting.id, {
            on_hand: destOnHand,
            current_stock: destOnHand,
            available: destAvailable,
            last_updated: today,
          });
          destId = destExisting.id;
        } else {
          const created = await base44.entities.Inventory.create({
            product_id: sourceItem.product_id,
            product_name: sourceItem.product_name,
            sku: sourceItem.sku || "",
            warehouse: toWarehouse,
            on_hand: qty,
            current_stock: qty,
            available: qty,
            reserved: 0,
            unit_cost: sourceItem.unit_cost || 0,
            last_updated: today,
          });
          destId = created.id;
        }

        // 3. Create Transfer movement record
        await base44.entities.InventoryMovement.create({
          date: today,
          product_id: sourceItem.product_id || sourceItem.id,
          product_name: sourceItem.product_name,
          inventory_id: sourceItem.id,
          to_inventory_id: destId,
          movement_type: "Transfer",
          from_warehouse: sourceItem.warehouse || "Own Warehouse",
          to_warehouse: toWarehouse,
          quantity: qty,
          shipping_cost: 0,
          reference: reference || "",
          notes: notes || `Transfer to ${toWarehouse}`,
        });
      }
    },
    onSuccess: (_, form) => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["inventory_movements"] });
      setTransferDialog({ open: false, sourceItem: null });
      toast({ title: "Transfer complete", description: `${form.items.length} products transferred successfully.` });
    },
    onError: (e) => {
      toast({ title: "Transfer failed", description: e.message, variant: "destructive" });
    },
  });

  const doConsume = useMutation({
    mutationFn: (form) => recordConsumption(form, inventory, user),
    onSuccess: (res, form) => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["inventory_movements"] });
      qc.invalidateQueries({ queryKey: ["inventory_consumptions"] });
      qc.invalidateQueries({ queryKey: ["ledger_transactions"] });
      setConsumeDialog(false);
      const valStr = "$" + (res?.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      toast({ title: "Consumption recorded", description: `${form.quantity} units consumed. Expense of ${valStr} created in ledger.` });
    },
    onError: (e) => {
      toast({ title: "Consumption failed", description: e.message, variant: "destructive" });
    },
  });

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await base44.functions.invoke("recalcInventory", {});
      await qc.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: "Stock recalculated", description: "All inventory levels updated from movement history." });
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setRecalculating(false);
  };

  const availableProducts = products.filter(p => !inventory.some(i => i.product_id === p.id));
  
  const filteredInventory = warehouseFilter === "all" 
    ? inventory 
    : inventory.filter(i => (i.warehouse || "Own Warehouse") === warehouseFilter);

  return (
    <div className="p-4 lg:p-8 max-w-screen-xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track stock levels and movements</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleRecalculate} disabled={recalculating} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${recalculating ? "animate-spin" : ""}`} /> Recalculate Stock
            </Button>
            <Button variant="outline" onClick={() => setTransferDialog({ open: true, sourceItem: null })} className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50">
              <ArrowRight className="h-4 w-4" /> Transfer Stock
            </Button>
            <Button variant="outline" onClick={() => setConsumeDialog(true)} className="gap-2 border-amber-200 text-amber-700 hover:bg-amber-50">
              <PackageX className="h-4 w-4" /> Record Consumption
            </Button>
            <Button variant="outline" onClick={() => setMovDialog({ open: true, inventoryId: null })} className="gap-2">
              <ArrowUpDown className="h-4 w-4" /> Record Movement
            </Button>
            <Button onClick={() => setInvDialog({ open: true, item: null })} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </div>
        )}
      </div>

      <LowStockAlerts inventory={inventory} />
      <InventoryStatsBar inventory={inventory} />

      <Tabs defaultValue="stock">
        <TabsList className="bg-slate-100 rounded-lg">
          <TabsTrigger value="stock" className="gap-2"><Package className="h-3.5 w-3.5" />Stock Levels</TabsTrigger>
          <TabsTrigger value="movements" className="gap-2"><ArrowUpDown className="h-3.5 w-3.5" />Movements</TabsTrigger>
          <TabsTrigger value="consumption" className="gap-2"><PackageX className="h-3.5 w-3.5" />Consumption</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-4">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">Warehouse:</span>
            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehouses.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {filteredInventory.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="bg-slate-100 rounded-full p-4 mb-3">
                <Package className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">No inventory items yet</p>
              <p className="text-sm text-slate-400 mt-1">Add products to start tracking stock levels</p>
              {isAdmin && (
                <Button onClick={() => setInvDialog({ open: true, item: null })} className="mt-4 bg-indigo-600 hover:bg-indigo-700 gap-2">
                  <Plus className="h-4 w-4" /> Add Product
                </Button>
              )}
            </div>
          ) : (
            <InventoryTable
              inventory={filteredInventory}
              onEdit={isAdmin ? item => setInvDialog({ open: true, item }) : null}
              onDelete={isAdmin ? item => { if (confirm(`Remove "${item.product_name}" from inventory?`)) deleteInventory.mutate(item.id); } : null}
              onAddMovement={isAdmin ? id => setMovDialog({ open: true, inventoryId: id }) : null}
              onTransfer={isAdmin ? item => setTransferDialog({ open: true, sourceItem: item }) : null}
            />
          )}
        </TabsContent>

        <TabsContent value="movements" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-slate-500">{movements.length} total movements</p>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setMovDialog({ open: true, inventoryId: null })} className="gap-2">
                <Plus className="h-3.5 w-3.5" /> Record Movement
              </Button>
            )}
          </div>
          <MovementsTable movements={movements} onDelete={isAdmin ? m => { if (confirm("Delete this movement? Stock will NOT be automatically reversed.")) deleteMovement.mutate(m.id); } : null} />
        </TabsContent>

        <TabsContent value="consumption" className="mt-4">
          <ConsumptionTable consumptions={consumptions} />
        </TabsContent>
      </Tabs>

      <InventoryFormDialog
        open={invDialog.open}
        item={invDialog.item}
        products={availableProducts}
        suppliers={suppliers}
        onClose={() => setInvDialog({ open: false, item: null })}
        onSave={form => saveInventory.mutateAsync(form)}
      />
      <MovementFormDialog
        open={movDialog.open}
        inventory={inventory}
        products={products}
        defaultInventoryId={movDialog.inventoryId}
        onClose={() => setMovDialog({ open: false, inventoryId: null })}
        onSave={form => saveMovement.mutateAsync(form)}
      />
      <TransferDialog
        open={transferDialog.open}
        inventory={inventory}
        warehouses={warehouses}
        saving={doTransfer.isPending}
        onClose={() => setTransferDialog({ open: false, sourceItem: null })}
        onConfirm={form => doTransfer.mutate(form)}
      />
      <ConsumptionFormDialog
        open={consumeDialog}
        inventory={inventory}
        saving={doConsume.isPending}
        onClose={() => setConsumeDialog(false)}
        onConfirm={form => doConsume.mutate(form)}
      />
    </div>
  );
}