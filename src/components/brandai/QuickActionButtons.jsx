import React from "react";
import { Button } from "@/components/ui/button";
import {
  Instagram, Video, Package, Megaphone, Lightbulb,
  TrendingUp, Mail, Globe, BarChart2, DollarSign
} from "lucide-react";

const ACTIONS = [
  { label: "Instagram Post Ideas", icon: Instagram, color: "bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100", prompt: "Generate 5 creative Instagram post ideas for my brand. Include caption text, hashtags, and visual description for each post. Follow my brand voice and target audience." },
  { label: "TikTok Video Ideas", icon: Video, color: "bg-red-50 text-red-600 border-red-200 hover:bg-red-100", prompt: "Generate 5 TikTok video concept ideas for my brand. Include hook, content idea, trending angle, and call to action for each." },
  { label: "Product Description", icon: Package, color: "bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100", prompt: "Write compelling product descriptions for my top products. Make them conversion-focused, highlight key benefits, and match the brand voice." },
  { label: "Marketing Campaign", icon: Megaphone, color: "bg-violet-50 text-violet-600 border-violet-200 hover:bg-violet-100", prompt: "Create a complete marketing campaign strategy for my brand. Include campaign theme, target audience, channels, messaging, timeline, and success metrics." },
  { label: "New Product Ideas", icon: Lightbulb, color: "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100", prompt: "Suggest 5 new product ideas based on my current catalog, target audience, and brand positioning. Include product concept, target customer, estimated price range, and differentiation idea." },
  { label: "Analyze Profit Margins", icon: DollarSign, color: "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100", prompt: "Analyze my product pricing and profit data. Identify which products have the best and worst margins, suggest pricing adjustments, and recommend strategies to improve profitability." },
  { label: "Sales Insights", icon: BarChart2, color: "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100", prompt: "Analyze my sales performance and inventory data. Identify top performing products, slow movers, inventory risks, and growth opportunities. Provide actionable recommendations." },
  { label: "Email Marketing", icon: Mail, color: "bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-100", prompt: "Write an email marketing sequence (3 emails) for my brand. Include subject lines, preview text, and body copy. Focus on driving sales and brand loyalty." },
  { label: "Website Copy", icon: Globe, color: "bg-cyan-50 text-cyan-600 border-cyan-200 hover:bg-cyan-100", prompt: "Write compelling website homepage copy for my brand. Include hero headline, subheadline, value propositions, social proof section, and call to action. Match the brand voice." },
  { label: "Growth Strategy", icon: TrendingUp, color: "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100", prompt: "Create a 90-day growth strategy for my brand. Include marketing tactics, product bundling opportunities, pricing adjustments, upsell strategies, and KPIs to track." },
];

export default function QuickActionButtons({ onAction, loading }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick Actions</p>
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map((a) => (
          <Button
            key={a.label}
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => onAction(a.prompt, a.label)}
            className={`justify-start gap-2 text-xs h-9 font-medium border ${a.color} transition-all`}
          >
            <a.icon className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{a.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}