import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Globe, Pencil, CheckSquare, Square, Upload, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORMS = ["Shopify", "WordPress", "Custom", "Wix", "Webflow", "Squarespace"];
const SEO_STATUS_COLORS = { not_started: "bg-slate-100 text-slate-600", in_progress: "bg-amber-100 text-amber-700", optimized: "bg-emerald-100 text-emerald-700" };
const SEO_STATUS_LABELS = { not_started: "Not Started", in_progress: "In Progress", optimized: "Optimized" };

const CHECKLIST = [
  { key: "checklist_homepage", label: "Homepage" },
  { key: "checklist_product_pages", label: "Product Pages" },
  { key: "checklist_seo_setup", label: "SEO Setup" },
  { key: "checklist_analytics", label: "Analytics Setup" },
];

const DEFAULT = { channel_type: "website", handle_or_url: "", platform: "", hosting_provider: "", domain: "", seo_status: "not_started", launch_date: "", content_strategy_notes: "", checklist_homepage: false, checklist_product_pages: false, checklist_seo_setup: false, checklist_analytics: false, asset_urls: [], screenshot_urls: [] };

export default function MarketingWebsite() {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();

  const { data: channels = [] } = useQuery({
    queryKey: ["mkt_website"],
    queryFn: () => base44.entities.MarketingChannel.filter({ channel_type: "website" }),
    initialData: [],
    onSuccess: (data) => { if (data[0] && !form) setForm({ ...DEFAULT, ...data[0] }); }
  });

  const channel = channels[0] || null;

  const saveMutation = useMutation({
    mutationFn: (data) => channel ? base44.entities.MarketingChannel.update(channel.id, data) : base44.entities.MarketingChannel.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mkt_website"] }); setEditing(false); },
  });

  const startEdit = () => { setForm({ ...DEFAULT, ...channel }); setEditing(true); };
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(p => ({ ...p, [field]: [...(p[field] || []), file_url] }));
    setUploading(false);
  };

  const displayData = editing ? form : (channel || DEFAULT);

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center"><Globe className="h-5 w-5 text-blue-600" /></div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Website Management</h2>
            <p className="text-sm text-slate-400">Track your website, platform, and SEO status</p>
          </div>
        </div>
        {!editing ? (
          <Button onClick={startEdit} variant="outline" className="gap-2"><Pencil className="h-4 w-4" /> Edit</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </Button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Details */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-slate-700">Website Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div className="space-y-1"><Label>Website URL</Label><Input placeholder="https://yoursite.com" value={displayData.handle_or_url} onChange={e => set("handle_or_url", e.target.value)} /></div>
                <div className="space-y-1"><Label>Platform</Label>
                  <Select value={displayData.platform} onValueChange={v => set("platform", v)}>
                    <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
                    <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Hosting Provider</Label><Input value={displayData.hosting_provider} onChange={e => set("hosting_provider", e.target.value)} /></div>
                <div className="space-y-1"><Label>Domain</Label><Input value={displayData.domain} onChange={e => set("domain", e.target.value)} /></div>
                <div className="space-y-1"><Label>SEO Status</Label>
                  <Select value={displayData.seo_status} onValueChange={v => set("seo_status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="optimized">Optimized</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Launch Date</Label><Input type="date" value={displayData.launch_date} onChange={e => set("launch_date", e.target.value)} /></div>
              </>
            ) : (
              <div className="space-y-3">
                {[
                  { label: "Website URL", value: displayData.handle_or_url },
                  { label: "Platform", value: displayData.platform },
                  { label: "Hosting Provider", value: displayData.hosting_provider },
                  { label: "Domain", value: displayData.domain },
                  { label: "Launch Date", value: displayData.launch_date },
                ].map(f => (
                  <div key={f.label} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                    <span className="text-slate-500">{f.label}</span>
                    <span className="font-medium text-slate-800">{f.value || <span className="text-slate-300 italic">Not set</span>}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">SEO Status</span>
                  <Badge className={SEO_STATUS_COLORS[displayData.seo_status]}>{SEO_STATUS_LABELS[displayData.seo_status]}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-slate-700">Setup Checklist</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {CHECKLIST.map(item => (
              <div key={item.key} className="flex items-center gap-3 cursor-pointer" onClick={() => editing && set(item.key, !displayData[item.key])}>
                {displayData[item.key] ? <CheckSquare className="h-5 w-5 text-emerald-500 flex-shrink-0" /> : <Square className="h-5 w-5 text-slate-300 flex-shrink-0" />}
                <span className={cn("text-sm", displayData[item.key] ? "text-emerald-700 font-medium" : "text-slate-600")}>{item.label}</span>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-500">Progress</span>
                <span className="font-semibold">{CHECKLIST.filter(i => displayData[i.key]).length} / {CHECKLIST.length}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(CHECKLIST.filter(i => displayData[i.key]).length / CHECKLIST.length) * 100}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Notes */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-slate-700">Strategy Notes</CardTitle></CardHeader>
        <CardContent>
          {editing ? (
            <Textarea rows={4} placeholder="Add website strategy, SEO notes, content plan..." value={displayData.content_strategy_notes} onChange={e => set("content_strategy_notes", e.target.value)} />
          ) : (
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{displayData.content_strategy_notes || <span className="italic text-slate-300">No strategy notes yet.</span>}</p>
          )}
        </CardContent>
      </Card>

      {/* Assets */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-slate-700">Brand Assets & Screenshots</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {["asset_urls", "screenshot_urls"].map(field => (
            <div key={field}>
              <p className="text-xs font-semibold text-slate-500 mb-2">{field === "asset_urls" ? "Brand Assets" : "Website Screenshots"}</p>
              <div className="flex flex-wrap gap-2">
                {(displayData[field] || []).map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline bg-indigo-50 px-2 py-1 rounded">File {i + 1}</a>
                ))}
                {editing && (
                  <label className="cursor-pointer flex items-center gap-1 text-xs text-slate-500 border border-dashed border-slate-300 px-3 py-1.5 rounded hover:bg-slate-50">
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Upload
                    <input type="file" className="hidden" onChange={e => handleUpload(e, field)} />
                  </label>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}