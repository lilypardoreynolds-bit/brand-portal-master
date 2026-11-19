import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dna, RefreshCw, Pencil, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const CATEGORY_COLORS = {
  "Food & Beverage": "bg-orange-100 text-orange-700",
  "Beauty & Skincare": "bg-pink-100 text-pink-700",
  "Supplements & Health": "bg-emerald-100 text-emerald-700",
  "Apparel & Fashion": "bg-violet-100 text-violet-700",
  "Home & Lifestyle": "bg-amber-100 text-amber-700",
  "Tech & Gadgets": "bg-blue-100 text-blue-700",
};

export default function BlueprintHeader({ dna, onEdit, onRegenerate, generating }) {
  return (
    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Dna className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{dna.brand_name || "Your Brand"}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {dna.category && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-medium">{dna.category}</span>
              )}
              {dna.price_positioning && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-medium">{dna.price_positioning}</span>
              )}
              {dna.target_gender && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-medium">{dna.target_gender}</span>
              )}
              {dna.target_age_range && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-medium">{dna.target_age_range}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button size="sm" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
          <Button size="sm" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={onRegenerate} disabled={generating}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${generating ? "animate-spin" : ""}`} /> Regenerate
          </Button>
        </div>
      </div>

      {dna.problem_solved && (
        <div className="mt-4 p-3 rounded-xl bg-white/10">
          <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">Problem We Solve</p>
          <p className="text-sm text-white/90">{dna.problem_solved}</p>
        </div>
      )}

      {/* Quick links */}
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { label: "Product Dev", page: "ProductDevelopment" },
          { label: "Marketing Hub", page: "MarketingHub" },
          { label: "Profit Engine", page: "ProfitEngine" },
          { label: "Brand Strategy", page: "BrandStrategy" },
        ].map(link => (
          <Link key={link.page} to={createPageUrl(link.page)}>
            <span className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer font-medium">
              {link.label} <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}