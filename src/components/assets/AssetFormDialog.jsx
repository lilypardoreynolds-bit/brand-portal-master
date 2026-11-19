import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload, X, FileText, Image, Video, Layers, ExternalLink } from "lucide-react";
import { format } from "date-fns";

const PLATFORMS = ["Website", "Social Media", "Ads", "Packaging", "Email", "Print"];
const FILE_TYPES = ["Image", "Video", "PDF", "Design File", "Other"];

const DEFAULT = {
  asset_name: "", category: "", file_type: "Image", file_url: "", thumbnail_url: "",
  related_product: "", platform_usage: [], creator: "",
  upload_date: format(new Date(), "yyyy-MM-dd"), notes: "", tags: [], is_featured: false
};

export default function AssetFormDialog({ open, onClose, asset, onSave, categories }) {
  const [form, setForm] = useState(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setForm(asset ? { ...DEFAULT, ...asset } : DEFAULT);
  }, [asset, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const togglePlatform = (p) => {
    set("platform_usage", form.platform_usage?.includes(p)
      ? form.platform_usage.filter(x => x !== p)
      : [...(form.platform_usage || []), p]);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    // Auto-detect file type
    if (file.type.startsWith("image/")) set("file_type", "Image");
    else if (file.type.startsWith("video/")) set("file_type", "Video");
    else if (file.type === "application/pdf") set("file_type", "PDF");

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, file_url, file_type: f.file_type }));
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  const fileIcon = form.file_type === "Image" ? <Image className="h-4 w-4 text-blue-500" /> :
    form.file_type === "Video" ? <Video className="h-4 w-4 text-purple-500" /> :
    form.file_type === "PDF" ? <FileText className="h-4 w-4 text-red-500" /> :
    <Layers className="h-4 w-4 text-indigo-500" />;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{asset ? "Edit Asset" : "Upload Asset"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">

          {/* File Upload */}
          <div>
            <Label className="text-sm text-slate-600 mb-1 block">File</Label>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
            {form.file_url ? (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                {form.file_type === "Image" ? (
                  <img src={form.file_url} alt="preview" className="h-14 w-14 object-cover rounded-md flex-shrink-0" />
                ) : (
                  <div className="h-14 w-14 bg-white border border-slate-200 rounded-md flex items-center justify-center flex-shrink-0">
                    {fileIcon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">File uploaded</p>
                  <a href={form.file_url} target="_blank" rel="noreferrer" className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1">
                    <ExternalLink className="h-2.5 w-2.5" /> View file
                  </a>
                </div>
                <button onClick={() => set("file_url", "")} className="text-slate-400 hover:text-red-500 flex-shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-slate-200 rounded-lg py-6 flex flex-col items-center gap-2 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
              >
                {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                <span className="text-sm">{uploading ? "Uploading..." : "Click to upload"}</span>
                <span className="text-xs">Images, Videos, PDFs, Design files</span>
              </button>
            )}
          </div>

          {/* Asset Name */}
          <div>
            <Label>Asset Name *</Label>
            <Input value={form.asset_name} onChange={e => set("asset_name", e.target.value)} className="mt-1" placeholder="e.g. Primary Logo White Background" />
          </div>

          {/* Category & File Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => set("category", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>File Type</Label>
              <Select value={form.file_type} onValueChange={v => set("file_type", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FILE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Creator & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Creator / Designer</Label>
              <Input value={form.creator} onChange={e => set("creator", e.target.value)} className="mt-1" placeholder="Name" />
            </div>
            <div>
              <Label>Upload Date</Label>
              <Input type="date" value={form.upload_date} onChange={e => set("upload_date", e.target.value)} className="mt-1" />
            </div>
          </div>

          {/* Related Product */}
          <div>
            <Label>Related Product</Label>
            <Input value={form.related_product} onChange={e => set("related_product", e.target.value)} className="mt-1" placeholder="Product name (optional)" />
          </div>

          {/* Platform Usage */}
          <div>
            <Label className="block mb-2">Platform Usage</Label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    form.platform_usage?.includes(p)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-slate-200 text-slate-600 hover:border-indigo-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Featured */}
          <div className="flex items-center justify-between py-2 px-3 bg-amber-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-amber-800">Featured Asset</p>
              <p className="text-xs text-amber-600">Pin to top of dashboard</p>
            </div>
            <Switch checked={!!form.is_featured} onCheckedChange={v => set("is_featured", v)} />
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} className="mt-1" placeholder="Usage notes, version info, etc." />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.asset_name.trim()} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? "Saving..." : "Save Asset"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}