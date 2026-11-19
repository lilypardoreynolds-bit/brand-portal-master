import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Plus, Pencil, Trash2, Search, DollarSign, TrendingUp, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import InfluencerFormDialog from "@/components/marketing/InfluencerFormDialog";

const STATUS_COLORS = {
  Prospect: "bg-slate-100 text-slate-600",
  "Outreach Sent": "bg-blue-100 text-blue-700",
  Negotiating: "bg-amber-100 text-amber-700",
  Active: "bg-emerald-100 text-emerald-700",
  Completed: "bg-violet-100 text-violet-700",
  Declined: "bg-red-100 text-red-700",
};

const PLATFORM_COLORS = {
  Instagram: "text-pink-600", TikTok: "text-slate-800", YouTube: "text-red-600",
  Pinterest: "text-rose-600", "Multi-Platform": "text-violet-600",
};

export default function MarketingInfluencers() {
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const qc = useQueryClient();

  const { data: influencers = [] } = useQuery({
    queryKey: ["influencers"],
    queryFn: () => base44.entities.Influencer.list("-created_date"),
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editItem ? base44.entities.Influencer.update(editItem.id, data) : base44.entities.Influencer.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["influencers"] }); setShowDialog(false); setEditItem(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Influencer.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["influencers"] }),
  });

  const openEdit = (item) => { setEditItem(item); setShowDialog(true); };
  const openNew = () => { setEditItem(null); setShowDialog(true); };

  const filtered = influencers.filter(inf => {
    const matchSearch = !search || inf.name?.toLowerCase().includes(search.toLowerCase()) || inf.campaign_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || inf.partnership_status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalSales = influencers.reduce((s, i) => s + (i.sales_generated || 0), 0);
  const totalCommission = influencers.reduce((s, i) => s + (i.commission_paid || 0), 0);
  const activeCount = influencers.filter(i => i.partnership_status === "Active").length;

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Users className="h-5 w-5 text-emerald-600" /></div>
          <div><h2 className="text-xl font-bold text-slate-900">Influencers & Affiliates</h2><p className="text-sm text-slate-400">Track partnerships, campaigns, and performance</p></div>
        </div>
        <Button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 gap-2"><Plus className="h-4 w-4" /> Add Influencer</Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active Partners", value: activeCount, icon: Star, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Sales Generated", value: `$${totalSales.toLocaleString()}`, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Commissions Paid", value: `$${totalCommission.toLocaleString()}`, icon: DollarSign, color: "text-violet-600", bg: "bg-violet-50" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-slate-200">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0", s.bg)}><Icon className={cn("h-4 w-4", s.color)} /></div>
                <div><p className="text-xs text-slate-500">{s.label}</p><p className={cn("text-lg font-bold", s.color)}>{s.value}</p></div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input className="pl-9" placeholder="Search influencers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["all", "Prospect", "Active", "Completed"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize", filterStatus === s ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="py-16 flex flex-col items-center gap-3">
            <p className="text-slate-400 text-sm">No influencers found.</p>
            <Button onClick={openNew} variant="outline" size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Add Influencer</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(inf => (
            <Card key={inf.id} className="border-slate-200 hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {inf.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <p className="font-semibold text-slate-900">{inf.name}</p>
                      <span className={cn("text-xs font-medium", PLATFORM_COLORS[inf.platform] || "text-slate-600")}>{inf.platform}</span>
                      <Badge className={cn("text-xs", STATUS_COLORS[inf.partnership_status] || "bg-slate-100 text-slate-600")}>{inf.partnership_status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                      {[
                        { label: "Followers", value: inf.followers?.toLocaleString() },
                        { label: "Commission", value: `${inf.commission_rate || 0}%` },
                        { label: "Sales", value: `$${(inf.sales_generated || 0).toLocaleString()}` },
                        { label: "Paid", value: `$${(inf.commission_paid || 0).toLocaleString()}` },
                      ].map(m => (
                        <div key={m.label} className="bg-slate-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-slate-400">{m.label}</p>
                          <p className="text-sm font-semibold text-slate-800">{m.value || "—"}</p>
                        </div>
                      ))}
                    </div>
                    {inf.campaign_name && <p className="text-xs text-slate-400 mt-2">Campaign: <span className="text-slate-600">{inf.campaign_name}</span></p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(inf)}><Pencil className="h-3.5 w-3.5 text-slate-400" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(inf.id)}><Trash2 className="h-3.5 w-3.5 text-slate-400" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <InfluencerFormDialog
        open={showDialog}
        onClose={() => { setShowDialog(false); setEditItem(null); }}
        onSave={data => saveMutation.mutateAsync(data)}
        influencer={editItem}
      />
    </div>
  );
}