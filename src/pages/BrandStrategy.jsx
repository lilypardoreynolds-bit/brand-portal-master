import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Compass, Target, Users, Lightbulb, Swords, BarChart2, Mic2, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";

const sections = [
  { label: "Brand Overview", icon: Compass, page: "BrandOverview", color: "bg-indigo-50 text-indigo-600 border-indigo-100", desc: "Mission, vision, story & core values" },
  { label: "Target Audience", icon: Target, page: "BrandAudience", color: "bg-rose-50 text-rose-600 border-rose-100", desc: "Audience profiles & demographics" },
  { label: "Customer Personas", icon: Users, page: "BrandPersonas", color: "bg-amber-50 text-amber-700 border-amber-100", desc: "Detailed buyer persona cards" },
  { label: "Value Proposition", icon: Lightbulb, page: "BrandValue", color: "bg-emerald-50 text-emerald-700 border-emerald-100", desc: "USP, key benefits & solution" },
  { label: "Competitor Analysis", icon: Swords, page: "BrandCompetitors", color: "bg-violet-50 text-violet-700 border-violet-100", desc: "Competitive landscape & positioning" },
  { label: "Brand Positioning", icon: BarChart2, page: "BrandPositioning", color: "bg-sky-50 text-sky-700 border-sky-100", desc: "Market position, archetype & personality" },
  { label: "Voice & Messaging", icon: Mic2, page: "BrandMessaging", color: "bg-orange-50 text-orange-700 border-orange-100", desc: "Messaging pillars & tone of voice" },
];

export default function BrandStrategy() {
  const { data: overviews = [] } = useQuery({ queryKey: ["brand_overviews"], queryFn: () => base44.entities.BrandOverview.list(), initialData: [] });
  const { data: audiences = [] } = useQuery({ queryKey: ["target_audiences"], queryFn: () => base44.entities.TargetAudience.list(), initialData: [] });
  const { data: personas = [] } = useQuery({ queryKey: ["customer_personas"], queryFn: () => base44.entities.CustomerPersona.list(), initialData: [] });
  const { data: competitors = [] } = useQuery({ queryKey: ["competitors"], queryFn: () => base44.entities.Competitor.list(), initialData: [] });

  const brand = overviews[0];

  const counts = {
    BrandOverview: overviews.length,
    BrandAudience: audiences.length,
    BrandPersonas: personas.length,
    BrandValue: brand?.usp ? 1 : 0,
    BrandCompetitors: competitors.length,
    BrandPositioning: brand?.brand_archetype ? 1 : 0,
    BrandMessaging: brand?.brand_promise ? 1 : 0,
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
            <Compass className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Brand Strategy</h1>
            <p className="text-sm text-slate-500 mt-0.5">The strategic foundation that drives every decision</p>
          </div>
        </div>
        {brand && (
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-slate-800">{brand.brand_name}</p>
            {brand.tagline && <p className="text-xs text-slate-400 italic mt-0.5">"{brand.tagline}"</p>}
          </div>
        )}
      </div>

      {/* Quick Summary Strip */}
      {brand && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Archetype", value: brand.brand_archetype || "—" },
            { label: "Positioning", value: brand.price_positioning || "—" },
            { label: "Audiences", value: audiences.length || "—" },
            { label: "Competitors", value: competitors.length || "—" },
          ].map(s => (
            <Card key={s.label} className="border-slate-200 text-center">
              <CardContent className="py-3 px-2">
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Value Proposition Snapshot */}
      {brand?.usp && (
        <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">Unique Selling Proposition</p>
            <p className="text-slate-800 font-medium leading-relaxed">{brand.usp}</p>
          </CardContent>
        </Card>
      )}

      {/* Sections Grid */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Strategy Sections</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map(s => {
            const Icon = s.icon;
            const count = counts[s.page] || 0;
            const hasData = count > 0;
            return (
              <Link key={s.page} to={createPageUrl(s.page)}>
                <Card className={cn("border hover:shadow-md transition-all cursor-pointer group", s.color.includes("border") ? `border-${s.color.split("border-")[1]}` : "border-slate-200")}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", s.color.split(" ").slice(0, 2).join(" "))}><Icon className="h-5 w-5" /></div>
                      <div className="flex items-center gap-1.5">
                        {hasData
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          : <AlertCircle className="h-4 w-4 text-slate-300" />}
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="font-semibold text-slate-900">{s.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
                    </div>
                    {count > 0 && (
                      <Badge className="mt-3 bg-slate-100 text-slate-600 text-[10px]">{count} {count === 1 ? "entry" : "entries"}</Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Connected Modules */}
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Connects With</p>
          <div className="flex flex-wrap gap-2">
            {["Marketing Campaigns", "Content Strategy", "Product Development", "Pricing Strategy"].map(m => (
              <Badge key={m} className="bg-white border border-slate-200 text-slate-600 font-normal">{m}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}