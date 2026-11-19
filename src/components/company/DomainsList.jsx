import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe, Plus, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import DomainFormDialog from "./DomainFormDialog";
import EmptyState from "@/components/shared/EmptyState";

export default function DomainsList({ companyId, companyName }) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: domains = [] } = useQuery({
    queryKey: ["domains", companyId],
    queryFn: () => base44.entities.Domain.filter({ company_id: companyId }),
    enabled: !!companyId,
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Domain.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains", companyId] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Domain.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["domains", companyId] }),
  });

  const getExpiryBadge = (date) => {
    if (!date) return null;
    const days = differenceInDays(new Date(date), new Date());
    if (days < 0) return <Badge className="bg-red-100 text-red-700 border-red-200">Expired</Badge>;
    if (days <= 30) return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Expiring Soon</Badge>;
    return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Domains</h3>
        <Button onClick={() => setShowForm(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Domain
        </Button>
      </div>

      {domains.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No domains yet"
          description="Add your first domain for this company."
          actionLabel="Add Domain"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-3">
          {domains.map((domain) => (
            <Card key={domain.id} className="border-slate-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{domain.domain_name}</p>
                    <p className="text-xs text-slate-500">
                      {domain.registrar && `${domain.registrar} · `}
                      {domain.expiration_date && `Expires ${format(new Date(domain.expiration_date), "MMM d, yyyy")}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getExpiryBadge(domain.expiration_date)}
                  {domain.website_link && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a href={domain.website_link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                      </a>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(domain.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DomainFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        companyId={companyId}
        onSave={(data) => createMutation.mutateAsync(data)}
      />
    </div>
  );
}