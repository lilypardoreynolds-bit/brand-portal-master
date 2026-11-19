import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Circle, Rocket } from "lucide-react";

const CHECKLIST_ITEMS = [
  { key: "supplier_confirmed", label: "Supplier Confirmed" },
  { key: "final_cost_approved", label: "Final Cost Approved" },
  { key: "packaging_finalized", label: "Packaging Finalized" },
  { key: "inventory_ordered", label: "Inventory Ordered" },
  { key: "marketing_assets_ready", label: "Marketing Assets Ready" },
  { key: "product_listing_ready", label: "Product Listing Ready" },
];

const DEFAULT = { supplier_confirmed: false, final_cost_approved: false, packaging_finalized: false, inventory_ordered: false, marketing_assets_ready: false, product_listing_ready: false, notes: "" };

export default function LaunchTab({ ideaId }) {
  const queryClient = useQueryClient();

  const { data: checklists = [] } = useQuery({
    queryKey: ["launch_checklist", ideaId],
    queryFn: () => base44.entities.LaunchChecklist.filter({ product_idea_id: ideaId }),
  });

  const existing = checklists[0];
  const data = existing || DEFAULT;

  const saveMutation = useMutation({
    mutationFn: (update) => existing
      ? base44.entities.LaunchChecklist.update(existing.id, update)
      : base44.entities.LaunchChecklist.create({ ...update, product_idea_id: ideaId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["launch_checklist", ideaId] }),
  });

  const toggle = (key) => saveMutation.mutate({ ...data, [key]: !data[key] });

  const completedCount = CHECKLIST_ITEMS.filter(item => data[item.key]).length;
  const percentage = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);

  return (
    <div className="mt-4 space-y-4">
      <h3 className="text-base font-semibold text-slate-800">Launch Readiness Checklist</h3>

      <Card className={`border ${percentage === 100 ? "border-green-200 bg-green-50" : "border-slate-200"}`}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Rocket className={`h-5 w-5 ${percentage === 100 ? "text-green-600" : "text-slate-400"}`} />
              <span className="font-semibold text-slate-800">
                {percentage === 100 ? "Ready to Launch! 🚀" : `${completedCount} of ${CHECKLIST_ITEMS.length} complete`}
              </span>
            </div>
            <span className={`text-xl font-bold ${percentage === 100 ? "text-green-600" : "text-slate-700"}`}>{percentage}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${percentage === 100 ? "bg-green-500" : "bg-indigo-500"}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200">
        <CardContent className="p-5 space-y-3">
          {CHECKLIST_ITEMS.map(item => {
            const checked = data[item.key];
            return (
              <button
                key={item.key}
                onClick={() => toggle(item.key)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                  checked ? "bg-green-50 border-green-200" : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                {checked
                  ? <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  : <Circle className="h-5 w-5 text-slate-300 flex-shrink-0" />}
                <span className={`text-sm font-medium ${checked ? "text-green-700 line-through" : "text-slate-700"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border border-slate-200">
        <CardContent className="p-5">
          <Label className="text-sm font-semibold text-slate-700">Launch Notes</Label>
          <Textarea
            value={data.notes || ""}
            onChange={e => saveMutation.mutate({ ...data, notes: e.target.value })}
            rows={3}
            placeholder="Add any notes about launch preparation..."
            className="mt-2"
          />
        </CardContent>
      </Card>
    </div>
  );
}