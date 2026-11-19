import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Save, X, DollarSign } from "lucide-react";

const COST_FIELDS = [
  { key: "manufacturing_cost", label: "Manufacturing Cost" },
  { key: "packaging_cost", label: "Packaging Cost" },
  { key: "shipping_estimate", label: "Shipping Estimate" },
  { key: "import_duties_estimate", label: "Import / Duties Estimate" },
  { key: "fulfillment_estimate", label: "Fulfillment Estimate" },
  { key: "other_costs", label: "Other Costs" },
];

const DEFAULT_COSTS = { manufacturing_cost: 0, packaging_cost: 0, shipping_estimate: 0, import_duties_estimate: 0, fulfillment_estimate: 0, other_costs: 0, notes: "" };

export default function CostTab({ ideaId }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(DEFAULT_COSTS);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: costs = [] } = useQuery({
    queryKey: ["product_costs", ideaId],
    queryFn: () => base44.entities.ProductCost.filter({ product_idea_id: ideaId }),
  });

  const existing = costs[0];

  const saveMutation = useMutation({
    mutationFn: (data) => existing
      ? base44.entities.ProductCost.update(existing.id, data)
      : base44.entities.ProductCost.create({ ...data, product_idea_id: ideaId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product_costs", ideaId] });
      setEditing(false);
      setSaving(false);
    },
  });

  const startEdit = () => {
    setForm({ ...DEFAULT_COSTS, ...existing });
    setEditing(true);
  };

  const handleSave = () => {
    setSaving(true);
    saveMutation.mutate(form);
  };

  const totalCost = COST_FIELDS.reduce((sum, f) => {
    const val = editing ? form[f.key] : (existing?.[f.key] ?? 0);
    return sum + (parseFloat(val) || 0);
  }, 0);

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800">Cost Development</h3>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={startEdit} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> {existing ? "Edit Costs" : "Add Costs"}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5" /></Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 gap-1">
              <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      {/* Total Cost Banner */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Estimated Total Cost per Unit</p>
            <p className="text-2xl font-bold text-indigo-700">${totalCost.toFixed(2)}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-slate-400">Suggested Retail (3x)</p>
            <p className="text-lg font-semibold text-slate-700">${(totalCost * 3).toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card className="border border-slate-200">
        <CardContent className="p-5 space-y-4">
          {COST_FIELDS.map(f => {
            const val = editing ? form[f.key] : (existing?.[f.key] ?? 0);
            const pct = totalCost > 0 ? ((parseFloat(val) || 0) / totalCost) * 100 : 0;
            return (
              <div key={f.key}>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-sm text-slate-600">{f.label}</Label>
                  {editing ? (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) || 0 }))}
                      className="w-28 h-7 text-sm text-right"
                    />
                  ) : (
                    <span className="text-sm font-medium text-slate-800">${parseFloat(val || 0).toFixed(2)}</span>
                  )}
                </div>
                {!editing && (
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-indigo-400 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>
            );
          })}
          <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
            <span className="font-semibold text-slate-800">Total</span>
            <span className="font-bold text-lg text-indigo-700">${totalCost.toFixed(2)}</span>
          </div>
          {editing && (
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="mt-1" />
            </div>
          )}
          {!editing && existing?.notes && (
            <p className="text-sm text-slate-500 border-t border-slate-100 pt-3">{existing.notes}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}