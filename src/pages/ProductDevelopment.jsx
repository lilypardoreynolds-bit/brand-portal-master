import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Lightbulb, FlaskConical, Rocket, ArrowRight, Truck, ExternalLink, Pencil, Trash2 } from "lucide-react";
import ProductIdeaFormDialog from "@/components/product/ProductIdeaFormDialog";
import SupplierFormDialog from "@/components/product/SupplierFormDialog";

const STATUS_CONFIG = {
  "Idea": { color: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
  "Research": { color: "bg-blue-100 text-blue-700", dot: "bg-blue-400" },
  "Prototype": { color: "bg-purple-100 text-purple-700", dot: "bg-purple-400" },
  "Testing": { color: "bg-orange-100 text-orange-700", dot: "bg-orange-400" },
  "Production": { color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-400" },
  "Ready to Launch": { color: "bg-green-100 text-green-700", dot: "bg-green-400" },
};

const STAGES = ["Idea", "Research", "Prototype", "Testing", "Production", "Ready to Launch"];

export default function ProductDevelopment() {
  const [showForm, setShowForm] = useState(false);
  const [editingIdea, setEditingIdea] = useState(null);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [activeTab, setActiveTab] = useState("ideas");
  const queryClient = useQueryClient();

  const { data: ideas = [] } = useQuery({
    queryKey: ["product_ideas"],
    queryFn: () => base44.entities.ProductIdea.list("-created_date"),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => base44.entities.Supplier.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProductIdea.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["product_ideas"] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductIdea.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["product_ideas"] }); setShowForm(false); setEditingIdea(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductIdea.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["product_ideas"] }),
  });

  const createSupplierMutation = useMutation({
    mutationFn: (data) => base44.entities.Supplier.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["suppliers"] }); setShowSupplierForm(false); },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Supplier.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["suppliers"] }); setShowSupplierForm(false); setEditingSupplier(null); },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (id) => base44.entities.Supplier.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  });

  const statCounts = STAGES.reduce((acc, s) => {
    acc[s] = ideas.filter(i => i.status === s).length;
    return acc;
  }, {});

  const statCards = [
    { label: "Total Ideas", value: ideas.length, icon: Lightbulb, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "In Development", value: (statCounts["Research"] || 0) + (statCounts["Prototype"] || 0), icon: FlaskConical, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "In Testing", value: statCounts["Testing"] || 0, icon: FlaskConical, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Ready to Launch", value: statCounts["Ready to Launch"] || 0, icon: Rocket, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Development</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your product lifecycle from idea to launch</p>
        </div>
        {activeTab === "ideas" ? (
          <Button onClick={() => { setEditingIdea(null); setShowForm(true); }} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-1" /> New Idea
          </Button>
        ) : (
          <Button onClick={() => { setEditingSupplier(null); setShowSupplierForm(true); }} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-1" /> Register Supplier
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-2">
          <TabsTrigger value="ideas">Product Ideas</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="ideas" className="space-y-8 mt-0">

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <Card key={s.label} className="border border-slate-200">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-10 w-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline Board */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-4">Pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAGES.map((stage) => {
            const stageIdeas = ideas.filter(i => i.status === stage);
            const cfg = STATUS_CONFIG[stage];
            return (
              <div key={stage} className="bg-white rounded-xl border border-slate-200 p-3 min-h-[160px]">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                  <span className="text-xs font-semibold text-slate-600 truncate">{stage}</span>
                  <span className="ml-auto text-xs text-slate-400">{stageIdeas.length}</span>
                </div>
                <div className="space-y-2">
                  {stageIdeas.map(idea => (
                    <Link key={idea.id} to={createPageUrl(`ProductDetail?id=${idea.id}`)}>
                      <div className="bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg p-2 cursor-pointer transition-colors group">
                        <p className="text-xs font-medium text-slate-800 truncate group-hover:text-indigo-700">{idea.name}</p>
                        {idea.category && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{idea.category}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* All Ideas Table */}
      <Card className="border border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">All Product Ideas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {ideas.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Lightbulb className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No product ideas yet. Add your first one!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {ideas.map(idea => {
                const cfg = STATUS_CONFIG[idea.status] || STATUS_CONFIG["Idea"];
                return (
                  <div key={idea.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{idea.name}</p>
                      {idea.category && <p className="text-xs text-slate-400">{idea.category}</p>}
                    </div>
                    {idea.target_audience && (
                      <span className="hidden md:block text-xs text-slate-500 truncate max-w-[140px]">{idea.target_audience}</span>
                    )}
                    <Badge className={`${cfg.color} border-0 text-xs`}>{idea.status}</Badge>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-500 hover:text-slate-800"
                        onClick={() => { setEditingIdea(idea); setShowForm(true); }}
                      >
                        Edit
                      </Button>
                      <Link to={createPageUrl(`ProductDetail?id=${idea.id}`)}>
                        <Button size="sm" variant="outline" className="text-xs gap-1">
                          Open <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

        </TabsContent>

        <TabsContent value="suppliers" className="mt-0">
          {suppliers.length === 0 ? (
            <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-xl">
              <Truck className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No suppliers registered yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {suppliers.map(s => (
                <Card key={s.id} className="border border-slate-200">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-800">{s.supplier_name}</p>
                        {s.country && <p className="text-xs text-slate-400">{s.country}</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingSupplier(s); setShowSupplierForm(true); }}>
                          <Pencil className="h-3.5 w-3.5 text-slate-400" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (confirm(`Delete "${s.supplier_name}"?`)) deleteSupplierMutation.mutate(s.id); }}>
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 space-y-1">
                      {s.address && <p>📍 {s.address}</p>}
                      {s.contact_person && <p>👤 {s.contact_person}</p>}
                      {s.email && <p>✉️ {s.email}</p>}
                      {s.phone && <p>📞 {s.phone}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {s.profile_link && (
                        <a href={s.profile_link} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline bg-indigo-50 px-2 py-1 rounded-md">
                          <ExternalLink className="h-3 w-3" /> Profile
                        </a>
                      )}
                      {(s.license_document_urls || []).map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:underline bg-slate-100 px-2 py-1 rounded-md">
                          📄 Doc {i + 1}
                        </a>
                      ))}
                    </div>
                    {s.notes && <p className="text-xs text-slate-400 italic border-t border-slate-100 pt-2">{s.notes}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ProductIdeaFormDialog
        open={showForm}
        idea={editingIdea}
        onClose={() => { setShowForm(false); setEditingIdea(null); }}
        onSave={(data) => {
          if (editingIdea) updateMutation.mutate({ id: editingIdea.id, data });
          else createMutation.mutate(data);
        }}
      />

      <SupplierFormDialog
        open={showSupplierForm}
        supplier={editingSupplier}
        onClose={() => { setShowSupplierForm(false); setEditingSupplier(null); }}
        onSave={(data) => {
          if (editingSupplier) updateSupplierMutation.mutate({ id: editingSupplier.id, data });
          else createSupplierMutation.mutate(data);
        }}
      />
    </div>
  );
}