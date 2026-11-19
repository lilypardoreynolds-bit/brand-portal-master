import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PricingInputs from "@/components/pricing/PricingInputs";
import ChannelResultsGrid from "@/components/pricing/ChannelResultsGrid";
import ScenarioPanel from "@/components/pricing/ScenarioPanel";
import { calcLandedCost } from "@/components/pricing/pricingCalc";
import { LayoutGrid } from "lucide-react";
import ProductFormDialog from "@/components/product/ProductFormDialog";

const DEFAULT_FORM = {
  product_cost: 0,
  shipping_cost: 0,
  import_fees: 0,
  amazon_fba_fee: 0,
  wholesale_price: 0,
  retail_price: 0,
};

export default function PricingStrategy() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [productDialog, setProductDialog] = useState(false);
  const [productFromScenario, setProductFromScenario] = useState(null);
  const qc = useQueryClient();

  const { data: scenarios = [] } = useQuery({
    queryKey: ["pricing_scenarios"],
    queryFn: () => base44.entities.PricingScenario.list("-created_date"),
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: ({ data, isEdit }) => {
      if (isEdit) {
        const { id, created_date, updated_date, created_by, ...fields } = data;
        return base44.entities.PricingScenario.update(id, fields);
      }
      return base44.entities.PricingScenario.create(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing_scenarios"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.PricingScenario.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing_scenarios"] }),
  });

  const handleSave = (data, isEdit) => saveMutation.mutate({ data, isEdit });
  const handleLoad = (scenario) => {
    const { id, created_date, updated_date, created_by, name, notes, ...fields } = scenario;
    setForm({ ...DEFAULT_FORM, ...fields });
  };

  const handleCreateProduct = (scenario) => {
    // Map scenario fields → product form fields
    setProductFromScenario({
      name: scenario.name || "",
      manufacturing_cost: scenario.product_cost || 0,
      shipping_cost: scenario.shipping_cost || 0,
      import_duties_cost: scenario.import_cost || 0,
      packaging_cost: scenario.import_extra_costs || 0,
      other_costs: scenario.ops_extra_costs || 0,
      marketplace_fees: scenario.amazon_fba_fee || 0,
      wholesale_price: scenario.wholesale_price || 0,
      retail_price: scenario.retail_price || 0,
      pricing_strategy_notes: scenario.notes || "",
    });
    setProductDialog(true);
  };

  const handleProductSave = async (data) => {
    if (data.id) {
      await base44.entities.Product.update(data.id, data);
    } else {
      await base44.entities.Product.create(data);
    }
  };

  const landed = calcLandedCost(form);

  return (
    <>
    <div className="p-4 lg:p-8 max-w-screen-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
          <LayoutGrid className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Pricing Strategy</h2>
          <p className="text-sm text-slate-500">Model channel-by-channel margins, ROI, and profit before committing to a price</p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left — inputs + results */}
        <div className="flex-1 min-w-0 space-y-6">
          <PricingInputs form={form} onChange={setForm} />

          {/* Results */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Channel Results</h3>
              <span className="text-xs text-slate-400">— Landed cost: <span className="font-semibold text-slate-600">${landed.toFixed(2)}</span></span>
            </div>
            <ChannelResultsGrid scenario={form} />
          </div>
        </div>

        {/* Right — scenario panel */}
        <div className="xl:w-80 w-full">
          <div className="xl:sticky xl:top-6">
            <ScenarioPanel
              scenarios={scenarios}
              onSave={handleSave}
              onLoad={handleLoad}
              onDelete={id => deleteMutation.mutate(id)}
              currentForm={form}
              onCreateProduct={handleCreateProduct}
            />
          </div>
        </div>
      </div>
    </div>

      <ProductFormDialog
        open={productDialog}
        onClose={() => setProductDialog(false)}
        product={productFromScenario}
        onSave={handleProductSave}
      />
    </>
  );
}