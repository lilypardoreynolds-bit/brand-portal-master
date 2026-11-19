import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Rocket, Heart, Target, Edit2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STAGE_CONFIG = {
  Idea: { color: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
  Development: { color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  Launching: { color: "bg-violet-100 text-violet-700 border-violet-200", dot: "bg-violet-500" },
  Scaling: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
};

const HEALTH_CONFIG = {
  "On Track": { color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  "Attention Needed": { color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  "Critical": { color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
};

export default function BrandStatusCard({ brandOverview, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    brand_stage: brandOverview?.brand_stage || "Development",
    brand_health: brandOverview?.brand_health || "On Track",
    current_focus: brandOverview?.current_focus || "",
  });

  const handleSave = async () => {
    await onUpdate(form);
    setEditing(false);
  };

  const stage = form.brand_stage || "Development";
  const health = form.brand_health || "On Track";
  const stageConf = STAGE_CONFIG[stage] || STAGE_CONFIG["Development"];
  const healthConf = HEALTH_CONFIG[health] || HEALTH_CONFIG["On Track"];

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Brand Status</CardTitle>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(!editing)}>
          {editing ? <Check className="h-4 w-4 text-emerald-600" /> : <Edit2 className="h-3.5 w-3.5 text-slate-400" />}
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Brand Stage */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Rocket className="h-3.5 w-3.5" /> Brand Stage
          </div>
          {editing ? (
            <Select value={form.brand_stage} onValueChange={v => setForm(f => ({ ...f, brand_stage: v }))}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(STAGE_CONFIG).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold w-fit ${stageConf.color}`}>
              <span className={`h-2 w-2 rounded-full ${stageConf.dot}`} />
              {stage}
            </div>
          )}
        </div>

        {/* Brand Health */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Heart className="h-3.5 w-3.5" /> Brand Health
          </div>
          {editing ? (
            <Select value={form.brand_health} onValueChange={v => setForm(f => ({ ...f, brand_health: v }))}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(HEALTH_CONFIG).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold w-fit ${healthConf.color}`}>
              <span className={`h-2 w-2 rounded-full ${healthConf.dot}`} />
              {health}
            </div>
          )}
        </div>

        {/* Current Focus */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Target className="h-3.5 w-3.5" /> Current Focus
          </div>
          {editing ? (
            <Input
              className="h-8 text-sm"
              value={form.current_focus}
              onChange={e => setForm(f => ({ ...f, current_focus: e.target.value }))}
              placeholder="e.g. Preparing Amazon Launch"
            />
          ) : (
            <p className="text-sm font-medium text-slate-800">
              {form.current_focus || <span className="text-slate-400 italic">Not set</span>}
            </p>
          )}
        </div>
      </CardContent>
      {editing && (
        <div className="px-6 pb-4">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSave}>Save Changes</Button>
        </div>
      )}
    </Card>
  );
}