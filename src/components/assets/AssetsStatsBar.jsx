import React from "react";
import { Layers, Image, Video, FileText, Star } from "lucide-react";

export default function AssetsStatsBar({ assets }) {
  const total = assets.length;
  const images = assets.filter(a => a.file_type === "Image").length;
  const videos = assets.filter(a => a.file_type === "Video").length;
  const pdfs = assets.filter(a => a.file_type === "PDF").length;
  const featured = assets.filter(a => a.is_featured).length;

  const stats = [
    { label: "Total Assets", value: total, icon: Layers, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Images", value: images, icon: Image, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Videos", value: videos, icon: Video, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "PDFs", value: pdfs, icon: FileText, color: "text-red-600", bg: "bg-red-50" },
    { label: "Featured", value: featured, icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map(s => (
        <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className={`${s.bg} p-2 rounded-lg flex-shrink-0`}>
            <s.icon className={`h-4 w-4 ${s.color}`} />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}