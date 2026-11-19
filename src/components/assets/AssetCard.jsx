import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Image, Video, Layers, Star, Pencil, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";

const FILE_ICONS = {
  Image: { icon: Image, color: "text-blue-500", bg: "bg-blue-50" },
  Video: { icon: Video, color: "text-purple-500", bg: "bg-purple-50" },
  PDF: { icon: FileText, color: "text-red-500", bg: "bg-red-50" },
  "Design File": { icon: Layers, color: "text-indigo-500", bg: "bg-indigo-50" },
  Other: { icon: FileText, color: "text-slate-500", bg: "bg-slate-50" },
};

const PLATFORMS = ["Website", "Social Media", "Ads", "Packaging", "Email", "Print"];

export default function AssetCard({ asset, onEdit, onDelete }) {
  const ft = FILE_ICONS[asset.file_type] || FILE_ICONS.Other;
  const Icon = ft.icon;
  const isImage = asset.file_type === "Image";
  const previewUrl = asset.thumbnail_url || (isImage ? asset.file_url : null);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-200 group">
      {/* Preview */}
      <div className={`relative h-36 ${previewUrl ? "" : ft.bg} flex items-center justify-center overflow-hidden`}>
        {previewUrl ? (
          <img src={previewUrl} alt={asset.asset_name} className="w-full h-full object-cover" />
        ) : asset.file_type === "Video" && asset.file_url ? (
          <video src={asset.file_url} className="w-full h-full object-cover" />
        ) : (
          <Icon className={`h-10 w-10 ${ft.color}`} />
        )}
        {asset.is_featured && (
          <span className="absolute top-2 left-2 bg-amber-400 text-white rounded-full p-0.5">
            <Star className="h-3 w-3 fill-white" />
          </span>
        )}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {asset.file_url && (
            <a href={asset.file_url} target="_blank" rel="noreferrer">
              <Button size="icon" variant="secondary" className="h-6 w-6 bg-white/90 hover:bg-white shadow-sm">
                <ExternalLink className="h-3 w-3 text-slate-600" />
              </Button>
            </a>
          )}
          <Button size="icon" variant="secondary" onClick={() => onEdit(asset)} className="h-6 w-6 bg-white/90 hover:bg-white shadow-sm">
            <Pencil className="h-3 w-3 text-slate-600" />
          </Button>
          <Button size="icon" variant="secondary" onClick={() => onDelete(asset)} className="h-6 w-6 bg-white/90 hover:bg-red-50 shadow-sm">
            <Trash2 className="h-3 w-3 text-red-500" />
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-medium text-sm text-slate-800 truncate">{asset.asset_name}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${ft.color} border-current`}>
            {asset.file_type}
          </Badge>
          {asset.category && (
            <span className="text-[11px] text-slate-500 truncate">{asset.category}</span>
          )}
        </div>
        {asset.upload_date && (
          <p className="text-[10px] text-slate-400 mt-1.5">
            {format(new Date(asset.upload_date), "MMM d, yyyy")}
            {asset.creator && ` · ${asset.creator}`}
          </p>
        )}
        {asset.platform_usage?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {asset.platform_usage.slice(0, 3).map(p => (
              <span key={p} className="text-[9px] bg-slate-100 text-slate-500 rounded px-1.5 py-0.5">{p}</span>
            ))}
            {asset.platform_usage.length > 3 && (
              <span className="text-[9px] text-slate-400">+{asset.platform_usage.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}