import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, Plus, Package, DollarSign, Boxes, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import AllocationFormDialog from "@/components/marketing/AllocationFormDialog";
import AllocationsTable from "@/components/marketing/AllocationsTable";
import ConfirmActionDialog from "@/components/inventory/ConfirmActionDialog";

export default function MarketingAllocations() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: allocations = [], isLoading } = useQuery({
    queryKey: ["marketing_allocations"],
    queryFn: () => base44.entities.MarketingAllocation.list("-date"),
    initialData: [],
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => base44.entities.Inventory.list("product_name"),
    initialData: [],
  });

  const createAllocation = useMutation({
    mutationFn: async (data) => {
      const res = await base44.functions.invoke("marketingAllocation", { action: "create", ...data });
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketing_allocations"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: "Allocation created", description: "Stock reserved and marketing expense booked." });
    },
  });

  const deleteAllocation = useMutation({
    mutationFn: async (id) => {
      const res = await base44.functions.invoke("marketingAllocation", { action: "delete", id });
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketing_allocations"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["expenses"] });
      setDeleteTarget(null);
      toast({ title: "Allocation deleted", description: "Reserved units were released and the expense removed." });
    },
    onError: (e) => toast({ title: "Could not delete", description: e.message, variant: "destructive" }),
  });

  const productCostOf = (a) => a.product_cost ?? Math.round((a.quantity || 0) * (a.unit_cost || 0) * 100) / 100;
  const totalCostOf = (a) => a.total_cost ?? Math.round((productCostOf(a) + (a.shipping_cost || 0)) * 100) / 100;

  const totalUnits = allocations.reduce((s, a) => s + (a.quantity || 0), 0);
  const totalProduct = allocations.reduce((s, a) => s + productCostOf(a), 0);
  const totalShipping = allocations.reduce((s, a) => s + (a.shipping_cost || 0), 0);
  const totalCost = allocations.reduce((s, a) => s + totalCostOf(a), 0);
  const activeCount = allocations.filter(a => a.status !== "Completed").length;
  const money = (v) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const stats = [
    { label: "Allocations", value: allocations.length, icon: Gift, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Units Allocated", value: totalUnits, icon: Boxes, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "In Progress", value: activeCount, icon: Package, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Product Cost", value: money(totalProduct), icon: DollarSign, color: "text-slate-700", bg: "bg-slate-100" },
    { label: "Shipping Cost", value: money(totalShipping), icon: Truck, color: "text-sky-600", bg: "bg-sky-50" },
    { label: "Total Cost", value: money(totalCost), icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center"><Gift className="h-5 w-5 text-violet-600" /></div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Marketing Allocations</h2>
            <p className="text-sm text-slate-400">Units sent to Amazon Vine, samples and influencers. Stock is reserved, not sold.</p>
          </div>
        </div>
        <Button onClick={() => setFormOpen(true)} className="bg-violet-600 hover:bg-violet-700 gap-2">
          <Plus className="h-4 w-4" /> New Allocation
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-slate-200">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0", s.bg)}>
                  <Icon className={cn("h-4 w-4", s.color)} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className={cn("text-lg font-bold", s.color)}>{s.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-slate-400">Loading allocations…</div>
      ) : allocations.length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="py-16 flex flex-col items-center gap-3">
            <Gift className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">No allocations yet.</p>
            <Button onClick={() => setFormOpen(true)} variant="outline" size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> New Allocation</Button>
          </CardContent>
        </Card>
      ) : (
        <AllocationsTable allocations={allocations} onDelete={setDeleteTarget} />
      )}

      <AllocationFormDialog
        open={formOpen}
        inventory={inventory}
        onClose={() => setFormOpen(false)}
        onSave={data => createAllocation.mutateAsync(data)}
      />

      <ConfirmActionDialog
        open={!!deleteTarget}
        title="Delete this allocation?"
        description={deleteTarget
          ? `${deleteTarget.quantity} unit(s) of ${deleteTarget.product_name} will return to sellable stock and the $${(deleteTarget.total_cost || 0).toFixed(2)} marketing expense will be removed.`
          : ""}
        confirmLabel="Delete"
        destructive
        loading={deleteAllocation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteAllocation.mutate(deleteTarget.id)}
      />
    </div>
  );
}
