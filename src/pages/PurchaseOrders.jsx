import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Plus, Truck } from "lucide-react";

import PurchaseOrderFormDialog from "@/components/inventory/PurchaseOrderFormDialog";
import PurchaseOrdersTable from "@/components/inventory/PurchaseOrdersTable";
import MovementFormDialog from "@/components/inventory/MovementFormDialog";
import ConfirmDeliveryDialog from "@/components/inventory/ConfirmDeliveryDialog";

export default function PurchaseOrdersPage() {
  const isAdmin = useIsAdmin();
  const qc = useQueryClient();
  const [poDialog, setPoDialog] = useState({ open: false, po: null });
  const [movDialog, setMovDialog] = useState({ open: false, inventoryId: null });
  const [deliveryDialog, setDeliveryDialog] = useState({ open: false, po: null });

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

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ["purchase_orders"],
    queryFn: () => base44.entities.PurchaseOrder.list("-order_date"),
    initialData: [],
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => base44.entities.Inventory.list("product_name"),
    initialData: [],
  });

  const savePO = useMutation({
    mutationFn: async ({ poData, invoiceData }) => {
      let savedPO;
      if (poData.id) {
        const { id, ...rest } = poData;
        savedPO = await base44.entities.PurchaseOrder.update(id, rest);
      } else {
        savedPO = await base44.entities.PurchaseOrder.create(poData);
      }
      if (invoiceData && savedPO?.id) {
        await base44.entities.SupplierInvoice.create({ ...invoiceData, purchase_order_id: savedPO.id });
      }
      return savedPO;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["purchase_orders"] }); setPoDialog({ open: false, po: null }); },
  });

  const deletePO = useMutation({
    mutationFn: id => base44.entities.PurchaseOrder.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase_orders"] }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.PurchaseOrder.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase_orders"] }),
  });

  const confirmDelivery = useMutation({
    mutationFn: async ({ po, qtyReceived, notes }) => {
      // 1. Mark PO as Delivered
      await base44.entities.PurchaseOrder.update(po.id, { status: "Delivered", quantity: qtyReceived });

      const today = new Date().toISOString().split("T")[0];
      const lineCost = qtyReceived > 0 ? (po.total_amount || 0) / qtyReceived : 0;

      // 2. Process single product (based on PO structure)
      const productId = po.product_id;
      const productName = po.product_name;

      const existing = inventory.find(i => i.product_id === productId || i.product_name === productName);
      if (existing) {
        const newOnHand = (existing.on_hand || existing.current_stock || 0) + qtyReceived;
        const reserved = existing.reserved || 0;
        const newAvailable = Math.max(0, newOnHand - reserved);
        await base44.entities.Inventory.update(existing.id, {
          on_hand: newOnHand,
          current_stock: newOnHand,
          available: newAvailable,
          unit_cost: lineCost,
          last_updated: today,
        });
      } else {
        await base44.entities.Inventory.create({
          product_id: productId || "",
          product_name: productName,
          supplier_name: po.supplier_name || "",
          on_hand: qtyReceived,
          current_stock: qtyReceived,
          available: qtyReceived,
          unit_cost: lineCost,
          last_updated: today,
        });
      }

      // 3. Create Inbound movement
      await base44.entities.InventoryMovement.create({
        date: today,
        product_id: productId || "unknown",
        product_name: productName,
        inventory_id: existing?.id || "",
        movement_type: "Inbound",
        quantity: qtyReceived,
        reference: po.po_number || "",
        notes: notes || `Delivery from PO ${po.po_number}`,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase_orders"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["inventory_movements"] });
      setDeliveryDialog({ open: false, po: null });
    },
  });

  const saveMovement = useMutation({
    mutationFn: async (form) => {
      await base44.entities.InventoryMovement.create(form);
      const invItem = inventory.find(i => i.id === form.inventory_id);
      if (!invItem) return;
      let newOnHand = invItem.on_hand ?? invItem.current_stock ?? 0;
      const qty = Number(form.quantity);
      if (form.movement_type === "Inbound") newOnHand += qty;
      else if (form.movement_type === "Outbound") newOnHand = Math.max(0, newOnHand - qty);
      else newOnHand = qty; // Adjustment
      const reserved = invItem.reserved || 0;
      const newAvailable = Math.max(0, newOnHand - reserved);
      return base44.entities.Inventory.update(invItem.id, {
        on_hand: newOnHand,
        current_stock: newOnHand,
        available: newAvailable,
        last_updated: new Date().toISOString().split("T")[0],
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["inventory_movements"] });
      setMovDialog({ open: false, inventoryId: null });
    },
  });

  return (
    <div className="p-4 lg:p-8 max-w-screen-xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage supplier orders and deliveries</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setPoDialog({ open: true, po: null })} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <Plus className="h-4 w-4" /> New Purchase Order
          </Button>
        )}
      </div>

      {/* Table */}
      {purchaseOrders.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="bg-slate-100 rounded-full p-4 mb-3">
            <Truck className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">No purchase orders yet</p>
          <p className="text-sm text-slate-400 mt-1">Create your first purchase order to get started</p>
          {isAdmin && (
            <Button onClick={() => setPoDialog({ open: true, po: null })} className="mt-4 bg-indigo-600 hover:bg-indigo-700 gap-2">
              <Plus className="h-4 w-4" /> New Purchase Order
            </Button>
          )}
        </div>
      ) : (
        <PurchaseOrdersTable
          orders={purchaseOrders}
          onEdit={isAdmin ? po => setPoDialog({ open: true, po }) : null}
          onDelete={isAdmin ? po => { if (confirm(`Delete PO "${po.po_number}"?`)) deletePO.mutate(po.id); } : null}
          onRecordMovement={isAdmin ? po => {
            const invItem = inventory.find(i => i.product_id === po.product_id || i.product_name === po.product_name);
            setMovDialog({ open: true, inventoryId: invItem?.id || null });
          } : null}
          onMarkDelivered={isAdmin ? po => setDeliveryDialog({ open: true, po }) : null}
          onStatusChange={isAdmin ? (po, status) => updateStatus.mutate({ id: po.id, status }) : null}
        />
      )}

      {/* Dialogs */}
      <PurchaseOrderFormDialog
        open={poDialog.open}
        po={poDialog.po}
        products={products}
        suppliers={suppliers}
        onClose={() => setPoDialog({ open: false, po: null })}
        onSave={(poData, invoiceData) => savePO.mutateAsync({ poData, invoiceData })}
      />
      <MovementFormDialog
        open={movDialog.open}
        inventory={inventory}
        products={products}
        defaultInventoryId={movDialog.inventoryId}
        onClose={() => setMovDialog({ open: false, inventoryId: null })}
        onSave={form => saveMovement.mutateAsync(form)}
      />
      <ConfirmDeliveryDialog
        open={deliveryDialog.open}
        po={deliveryDialog.po}
        onClose={() => setDeliveryDialog({ open: false, po: null })}
        onConfirm={({ qtyReceived, notes }) => confirmDelivery.mutateAsync({ po: deliveryDialog.po, qtyReceived, notes })}
        saving={confirmDelivery.isPending}
      />
    </div>
  );
}