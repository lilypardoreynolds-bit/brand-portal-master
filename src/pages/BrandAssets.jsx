import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus, Search, LayoutGrid, List, FolderPlus, Settings2,
  Image, Layers, BookOpen, X, Trash2, Pencil
} from "lucide-react";
import { format } from "date-fns";

import AssetCard from "@/components/assets/AssetCard";
import AssetFormDialog from "@/components/assets/AssetFormDialog";
import CategoryFormDialog from "@/components/assets/CategoryFormDialog";
import BrandGuidelinesPanel from "@/components/assets/BrandGuidelinesPanel";
import AssetsStatsBar from "@/components/assets/AssetsStatsBar";

const DEFAULT_CATEGORIES = [
  "Logos", "Brand Guidelines", "Packaging Designs", "Product Images",
  "Marketing Creatives", "Advertising Assets", "Social Media Assets", "Video Content"
];

export default function BrandAssets() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("assets");
  const [viewMode, setViewMode] = useState("grid");
  const [assetDialog, setAssetDialog] = useState({ open: false, asset: null });
  const [catDialog, setCatDialog] = useState({ open: false, category: null });

  // Queries
  const { data: assets = [] } = useQuery({
    queryKey: ["brand_assets"],
    queryFn: () => base44.entities.BrandAsset.list("-upload_date"),
    initialData: [],
  });

  const { data: customCategories = [] } = useQuery({
    queryKey: ["asset_categories"],
    queryFn: () => base44.entities.AssetCategory.list("name"),
    initialData: [],
  });

  const { data: guidelines = [] } = useQuery({
    queryKey: ["brand_guidelines"],
    queryFn: () => base44.entities.BrandGuideline.list(),
    initialData: [],
  });

  const guideline = guidelines[0] || null;

  // All categories merged
  const allCategories = useMemo(() => {
    const custom = customCategories.map(c => c.name);
    return [...new Set([...DEFAULT_CATEGORIES, ...custom])];
  }, [customCategories]);

  // Mutations
  const createAsset = useMutation({
    mutationFn: d => base44.entities.BrandAsset.create(d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brand_assets"] }),
  });
  const updateAsset = useMutation({
    mutationFn: ({ id, ...d }) => base44.entities.BrandAsset.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brand_assets"] }),
  });
  const deleteAsset = useMutation({
    mutationFn: id => base44.entities.BrandAsset.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brand_assets"] }),
  });
  const createCategory = useMutation({
    mutationFn: d => base44.entities.AssetCategory.create(d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["asset_categories"] }),
  });
  const saveGuideline = useMutation({
    mutationFn: d => guideline
      ? base44.entities.BrandGuideline.update(guideline.id, d)
      : base44.entities.BrandGuideline.create(d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brand_guidelines"] }),
  });

  // Asset handlers
  const handleSaveAsset = async (form) => {
    if (form.id) {
      const { id, ...rest } = form;
      await updateAsset.mutateAsync({ id, ...rest });
    } else {
      await createAsset.mutateAsync(form);
    }
  };

  const handleDeleteAsset = (asset) => {
    if (confirm(`Delete "${asset.asset_name}"?`)) deleteAsset.mutate(asset.id);
  };

  // Filtered assets
  const filtered = useMemo(() => {
    return assets.filter(a => {
      const matchCat = activeCategory === "All" || a.category === activeCategory;
      const matchSearch = !search || a.asset_name?.toLowerCase().includes(search.toLowerCase()) ||
        a.creator?.toLowerCase().includes(search.toLowerCase()) ||
        a.related_product?.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [assets, activeCategory, search]);

  // Category counts
  const catCounts = useMemo(() => {
    const counts = { All: assets.length };
    allCategories.forEach(c => {
      counts[c] = assets.filter(a => a.category === c).length;
    });
    return counts;
  }, [assets, allCategories]);

  // Recently uploaded (last 5)
  const recent = useMemo(() => [...assets]
    .sort((a, b) => new Date(b.upload_date || b.created_date) - new Date(a.upload_date || a.created_date))
    .slice(0, 5), [assets]);

  // Featured
  const featured = assets.filter(a => a.is_featured);

  return (
    <div className="p-4 lg:p-8 max-w-screen-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Brand Assets</h1>
          <p className="text-sm text-slate-500 mt-0.5">Centralized library for all your brand files</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCatDialog({ open: true, category: null })} className="gap-2">
            <FolderPlus className="h-4 w-4" /> New Category
          </Button>
          <Button onClick={() => setAssetDialog({ open: true, asset: null })} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <Plus className="h-4 w-4" /> Upload Asset
          </Button>
        </div>
      </div>

      {/* Stats */}
      <AssetsStatsBar assets={assets} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 rounded-lg">
          <TabsTrigger value="assets" className="gap-2"><Layers className="h-3.5 w-3.5" />All Assets</TabsTrigger>
          <TabsTrigger value="guidelines" className="gap-2"><BookOpen className="h-3.5 w-3.5" />Brand Guidelines</TabsTrigger>
        </TabsList>

        {/* ASSETS TAB */}
        <TabsContent value="assets" className="mt-4 space-y-4">

          {/* Featured */}
          {featured.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">⭐ Featured Assets</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {featured.map(a => (
                  <AssetCard key={a.id} asset={a}
                    onEdit={asset => setAssetDialog({ open: true, asset })}
                    onDelete={handleDeleteAsset}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets..." className="pl-9" />
              {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>}
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant={viewMode === "grid" ? "default" : "outline"} onClick={() => setViewMode("grid")} className="h-9 w-9">
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button size="icon" variant={viewMode === "list" ? "default" : "outline"} onClick={() => setViewMode("list")} className="h-9 w-9">
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Category filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {["All", ...allCategories].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  activeCategory === cat
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-slate-200 text-slate-600 hover:border-indigo-300 bg-white"
                }`}
              >
                {cat}
                <span className={`ml-1.5 text-[11px] ${activeCategory === cat ? "text-indigo-200" : "text-slate-400"}`}>
                  {catCounts[cat] || 0}
                </span>
              </button>
            ))}
          </div>

          {/* Assets Grid/List */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-slate-100 rounded-full p-4 mb-3">
                <Image className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">No assets found</p>
              <p className="text-slate-400 text-sm mt-1">Upload your first asset to get started</p>
              <Button onClick={() => setAssetDialog({ open: true, asset: null })} className="mt-4 bg-indigo-600 hover:bg-indigo-700 gap-2">
                <Plus className="h-4 w-4" /> Upload Asset
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map(a => (
                <AssetCard key={a.id} asset={a}
                  onEdit={asset => setAssetDialog({ open: true, asset })}
                  onDelete={handleDeleteAsset}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              {filtered.map(a => (
                <div key={a.id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 group">
                  {/* Thumb */}
                  <div className="h-10 w-10 rounded-md overflow-hidden bg-slate-100 flex-shrink-0">
                    {a.file_type === "Image" && a.file_url
                      ? <img src={a.file_url} alt={a.asset_name} className="h-full w-full object-cover" />
                      : <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs">{a.file_type?.charAt(0)}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{a.asset_name}</p>
                    <p className="text-xs text-slate-400">{a.category} · {a.file_type} {a.creator && `· ${a.creator}`}</p>
                  </div>
                  {a.upload_date && <span className="text-xs text-slate-400 hidden sm:block">{format(new Date(a.upload_date), "MMM d, yyyy")}</span>}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {a.file_url && <a href={a.file_url} target="_blank" rel="noreferrer"><Button size="sm" variant="ghost" className="h-7 text-xs">Open</Button></a>}
                    <Button size="icon" variant="ghost" onClick={() => setAssetDialog({ open: true, asset: a })} className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteAsset(a)} className="h-7 w-7 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recently Uploaded */}
          {recent.length > 0 && activeCategory === "All" && !search && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Recently Uploaded</h3>
              <div className="space-y-2">
                {recent.map(a => (
                  <div key={a.id} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md overflow-hidden bg-slate-100 flex-shrink-0">
                      {a.file_type === "Image" && a.file_url
                        ? <img src={a.file_url} alt={a.asset_name} className="h-full w-full object-cover" />
                        : <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs">{a.file_type?.charAt(0)}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 truncate">{a.asset_name}</p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {a.upload_date ? format(new Date(a.upload_date), "MMM d") : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* GUIDELINES TAB */}
        <TabsContent value="guidelines" className="mt-4">
          <BrandGuidelinesPanel
            guideline={guideline}
            onSave={data => saveGuideline.mutateAsync(data)}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AssetFormDialog
        open={assetDialog.open}
        asset={assetDialog.asset}
        categories={allCategories}
        onClose={() => setAssetDialog({ open: false, asset: null })}
        onSave={handleSaveAsset}
      />
      <CategoryFormDialog
        open={catDialog.open}
        category={catDialog.category}
        onClose={() => setCatDialog({ open: false, category: null })}
        onSave={d => createCategory.mutateAsync(d)}
      />
    </div>
  );
}