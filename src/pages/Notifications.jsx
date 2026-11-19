import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Bell, Globe, ShieldCheck, MapPin, FileText, Check, Trash2, CheckCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import EmptyState from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

const typeIcons = {
  domain_expiry: Globe,
  resale_cert_expiry: FileText,
  lease_expiry: MapPin,
  trademark_renewal: ShieldCheck,
  general: Bell,
};

const severityColors = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-blue-100 text-blue-700 border-blue-200",
};

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => base44.entities.Notification.list("-created_date"),
    initialData: [],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Notification.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread_notifications"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread_notifications"] });
    },
  });

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    for (const n of unread) {
      await base44.entities.Notification.update(n.id, { is_read: true });
    }
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["unread_notifications"] });
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h2>
          <p className="text-sm text-slate-500 mt-0.5">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You'll be alerted when documents are expiring or need attention."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = typeIcons[notif.type] || Bell;
            return (
              <Card key={notif.id} className={cn("border-slate-200 transition-all", !notif.is_read && "bg-indigo-50/40 border-indigo-100")}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                    notif.severity === "critical" || notif.severity === "high" ? "bg-red-100" : "bg-amber-100"
                  )}>
                    <Icon className={cn(
                      "h-4 w-4",
                      notif.severity === "critical" || notif.severity === "high" ? "text-red-600" : "text-amber-600"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("font-medium text-sm", !notif.is_read ? "text-slate-900" : "text-slate-600")}>{notif.title}</p>
                      {!notif.is_read && <div className="h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{notif.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {notif.company_name && (
                        <Badge variant="outline" className="text-xs">{notif.company_name}</Badge>
                      )}
                      <Badge className={`${severityColors[notif.severity] || severityColors.low} border text-xs`}>
                        {notif.severity}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {format(new Date(notif.created_date), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notif.is_read && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateMutation.mutate({ id: notif.id, data: { is_read: true } })}>
                        <Check className="h-3.5 w-3.5 text-slate-400" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(notif.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-slate-400" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}