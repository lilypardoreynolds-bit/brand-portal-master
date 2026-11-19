import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function ChannelStatCard({ label, value, sub, icon: Icon, color = "text-indigo-600", bg = "bg-indigo-50" }) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", bg)}>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className={cn("text-xl font-bold", color)}>{value}</p>
          {sub && <p className="text-xs text-slate-400">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}