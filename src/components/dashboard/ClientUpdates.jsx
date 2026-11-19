import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Clock, ArrowRight, Edit2, Check } from "lucide-react";

const AREAS = [
  {
    key: "this_week_progress",
    label: "This Week Progress",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    placeholder: "e.g. Packaging finalized\nAmazon listing approved",
  },
  {
    key: "waiting_on_client",
    label: "Waiting on Client",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    placeholder: "e.g. Approve product label\nConfirm retail price",
  },
  {
    key: "next_steps",
    label: "Next Steps",
    icon: ArrowRight,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    placeholder: "e.g. Launch marketing campaign\nSend inventory to Amazon FBA",
  },
];

export default function ClientUpdates({ brandOverview, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    this_week_progress: brandOverview?.this_week_progress || "",
    waiting_on_client: brandOverview?.waiting_on_client || "",
    next_steps: brandOverview?.next_steps || "",
  });

  const handleSave = async () => {
    await onUpdate(form);
    setEditing(false);
  };

  const renderBullets = (text) => {
    if (!text) return <p className="text-sm text-slate-400 italic">Nothing added yet</p>;
    return (
      <ul className="space-y-1">
        {text.split("\n").filter(Boolean).map((line, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-400 flex-shrink-0" />
            {line}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Client Updates</CardTitle>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(!editing)}>
          {editing ? <Check className="h-4 w-4 text-emerald-600" /> : <Edit2 className="h-3.5 w-3.5 text-slate-400" />}
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {AREAS.map(area => {
          const Icon = area.icon;
          return (
            <div key={area.key} className={`rounded-xl p-4 ${area.bg}`}>
              <div className={`flex items-center gap-2 mb-3 ${area.color}`}>
                <Icon className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-wide">{area.label}</p>
              </div>
              {editing ? (
                <Textarea
                  className="text-sm min-h-[100px] bg-white"
                  value={form[area.key]}
                  onChange={e => setForm(f => ({ ...f, [area.key]: e.target.value }))}
                  placeholder={area.placeholder}
                />
              ) : (
                renderBullets(form[area.key])
              )}
            </div>
          );
        })}
      </CardContent>
      {editing && (
        <div className="px-6 pb-4">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSave}>Save Updates</Button>
        </div>
      )}
    </Card>
  );
}