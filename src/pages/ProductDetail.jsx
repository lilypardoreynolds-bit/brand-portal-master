import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Package, Truck, FlaskConical, DollarSign, CheckSquare, Rocket, BarChart2 } from "lucide-react";
import ProductConceptTab from "@/components/product/ProductConceptTab";
import SupplierTab from "@/components/product/SupplierTab";
import PrototypeTab from "@/components/product/PrototypeTab";
import TestingTab from "@/components/product/TestingTab";
import CostTab from "@/components/product/CostTab";
import LaunchTab from "@/components/product/LaunchTab";
import ProductInventoryTab from "@/components/inventory/ProductInventoryTab";

const STATUS_CONFIG = {
  "Idea": { color: "bg-slate-100 text-slate-700" },
  "Research": { color: "bg-blue-100 text-blue-700" },
  "Prototype": { color: "bg-purple-100 text-purple-700" },
  "Testing": { color: "bg-orange-100 text-orange-700" },
  "Production": { color: "bg-yellow-100 text-yellow-700" },
  "Ready to Launch": { color: "bg-green-100 text-green-700" },
};

const STATUSES = ["Idea", "Research", "Prototype", "Testing", "Production", "Ready to Launch"];

export default function ProductDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const ideaId = urlParams.get("id");
  const queryClient = useQueryClient();

  const { data: idea, isLoading } = useQuery({
    queryKey: ["product_idea", ideaId],
    queryFn: () => base44.entities.ProductIdea.list().then(list => list.find(i => i.id === ideaId)),
    enabled: !!ideaId,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.ProductIdea.update(ideaId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["product_idea", ideaId] }),
  });

  const convertToProduct = async () => {
    if (!idea) return;
    const costs = await base44.entities.ProductCost.filter({ product_idea_id: ideaId });
    const costData = costs[0] || {};
    const total = (costData.manufacturing_cost || 0) + (costData.packaging_cost || 0) +
      (costData.shipping_estimate || 0) + (costData.import_duties_estimate || 0) +
      (costData.fulfillment_estimate || 0) + (costData.other_costs || 0);

    await base44.entities.Product.create({
      name: idea.name,
      category: idea.category,
      description: idea.description,
      manufacturing_cost: costData.manufacturing_cost || 0,
      packaging_cost: costData.packaging_cost || 0,
      shipping_cost: costData.shipping_estimate || 0,
      import_duties_cost: costData.import_duties_estimate || 0,
      fulfillment_cost: costData.fulfillment_estimate || 0,
      status: "active",
      notes: `Converted from Product Development. ${idea.notes || ""}`,
    });
    alert("Product successfully added to inventory/Profit Engine!");
  };

  if (isLoading) return <div className="p-8 text-slate-400">Loading...</div>;
  if (!idea) return <div className="p-8 text-slate-400">Product idea not found.</div>;

  const cfg = STATUS_CONFIG[idea.status] || STATUS_CONFIG["Idea"];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to={createPageUrl("ProductDevelopment")}>
          <Button variant="ghost" size="icon" className="mt-0.5">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{idea.name}</h1>
            <Badge className={`${cfg.color} border-0`}>{idea.status}</Badge>
          </div>
          {idea.category && <p className="text-slate-500 text-sm mt-1">{idea.category}</p>}
        </div>
        <div className="flex items-center gap-2">
          {idea.status === "Ready to Launch" && (
            <Button onClick={convertToProduct} className="bg-green-600 hover:bg-green-700 gap-1.5">
              <Rocket className="h-4 w-4" /> Convert to Product
            </Button>
          )}
          <select
            value={idea.status}
            onChange={(e) => updateMutation.mutate({ status: e.target.value })}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="concept">
        <TabsList className="grid grid-cols-4 md:grid-cols-7 w-full bg-slate-100">
          <TabsTrigger value="concept" className="text-xs gap-1"><Package className="h-3.5 w-3.5" />Concept</TabsTrigger>
          <TabsTrigger value="suppliers" className="text-xs gap-1"><Truck className="h-3.5 w-3.5" />Suppliers</TabsTrigger>
          <TabsTrigger value="prototypes" className="text-xs gap-1"><FlaskConical className="h-3.5 w-3.5" />Prototypes</TabsTrigger>
          <TabsTrigger value="testing" className="text-xs gap-1"><FlaskConical className="h-3.5 w-3.5" />Testing</TabsTrigger>
          <TabsTrigger value="costs" className="text-xs gap-1"><DollarSign className="h-3.5 w-3.5" />Costs</TabsTrigger>
          <TabsTrigger value="launch" className="text-xs gap-1"><CheckSquare className="h-3.5 w-3.5" />Launch</TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs gap-1"><BarChart2 className="h-3.5 w-3.5" />Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="concept">
          <ProductConceptTab idea={idea} onUpdate={(data) => updateMutation.mutate(data)} />
        </TabsContent>
        <TabsContent value="suppliers">
          <SupplierTab ideaId={ideaId} />
        </TabsContent>
        <TabsContent value="prototypes">
          <PrototypeTab ideaId={ideaId} />
        </TabsContent>
        <TabsContent value="testing">
          <TestingTab ideaId={ideaId} />
        </TabsContent>
        <TabsContent value="costs">
          <CostTab ideaId={ideaId} />
        </TabsContent>
        <TabsContent value="launch">
          <LaunchTab ideaId={ideaId} />
        </TabsContent>
        <TabsContent value="inventory">
          <ProductInventoryTab productId={ideaId} productName={idea.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}