import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const severityConfig = {
  critical: { icon: AlertCircle, bg: "bg-red-50", border: "border-red-200", text: "text-red-800", iconColor: "text-red-600" },
  high: { icon: AlertTriangle, bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", iconColor: "text-orange-600" },
  medium: { icon: AlertTriangle, bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", iconColor: "text-amber-600" },
  low: { icon: Info, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", iconColor: "text-blue-600" },
};

export default function KPIAlertBanner({ alerts }) {
  const queryClient = useQueryClient();
  const resolveMutation = useMutation({
    mutationFn: (id) => base44.entities.KPIAlert.update(id, { is_resolved: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kpi_alerts"] }),
  });

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const config = severityConfig[alert.severity] || severityConfig.medium;
        const Icon = config.icon;
        return (
          <Card key={alert.id} className={cn("border", config.border, config.bg)}>
            <CardContent className="p-3 flex items-center gap-3">
              <Icon className={cn("h-4 w-4 flex-shrink-0", config.iconColor)} />
              <div className="flex-1 min-w-0">
                <span className={cn("text-sm font-semibold", config.text)}>{alert.title}: </span>
                <span className={cn("text-sm", config.text)}>{alert.message}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0"
                onClick={() => resolveMutation.mutate(alert.id)}
              >
                <X className="h-3.5 w-3.5 text-slate-400" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}