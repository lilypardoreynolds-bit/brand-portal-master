import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe, Plus, Search, Trash2, ExternalLink, AlertTriangle, RefreshCw, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import EmptyState from "@/components/shared/EmptyState";
import DomainFormDialog from "@/components/company/DomainFormDialog";

export default function Domains() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingExpiry, setEditingExpiry] = useState(null);
  const [expiryValue, setExpiryValue] = useState("");
  const queryClient = useQueryClient();

  const { data: companies = [] } = useQuery({
    queryKey: ["company_profile"],
    queryFn: () => base44.entities.Company.list("-created_date", 1),
    initialData: [],
  });
  const company = companies[0];

  const { data: domains = [] } = useQuery({
    queryKey: ["domains"],
    queryFn: () => base44.entities.Domain.list("-created_date"),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Domain.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Domain.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["domains"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Domain.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["domains"] }),
  });

  const filtered = domains.filter((d) =>
    (d.domain_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const getExpiryInfo = (date) => {
    if (!date) return { label: "No expiry set", className: "bg-slate-100 text-slate-600 border-slate-200" };
    const days = differenceInDays(new Date(date), new Date());
    if (days < 0) return { label: "Expired", className: "bg-red-100 text-red-700 border-red-200" };
    if (days <= 7) return { label: `${days}d left`, className: "bg-red-100 text-red-700 border-red-200" };
    if (days <= 30) return { label: `${days}d left`, className: "bg-amber-100 text-amber-700 border-amber-200" };
    return { label: "Active", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  };

  const expiringSoon = domains.filter((d) => {
    if (!d.expiration_date) return false;
    const days = differenceInDays(new Date(d.expiration_date), new Date());
    return days >= 0 && days <= 30;
  });

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Domains</h2>
          <p className="text-sm text-slate-500 mt-0.5">{domains.length} domain{domains.length !== 1 ? "s" : ""} registered</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 gap-2"
        >
          <Plus className="h-4 w-4" /> Add Domain
        </Button>
      </div>

      {expiringSoon.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 mb-6">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">{expiringSoon.length} domain{expiringSoon.length !== 1 ? "s" : ""}</span> expiring within 30 days
            </p>
          </CardContent>
        </Card>
      )}

      {domains.length > 0 && (
        <div className="mb-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search domains..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No domains yet"
          description="Add your brand's domains to track registration and expiration."
          actionLabel="Add Domain"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((domain) => {
            const expiry = getExpiryInfo(domain.expiration_date);
            return (
              <Card key={domain.id} className="border-slate-200 hover:shadow-sm transition-shadow group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <Globe className="h-5 w-5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{domain.domain_name}</p>
                    <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
                      {domain.registrar && (
                        <span className="text-xs text-slate-500">{domain.registrar}</span>
                      )}
                      {domain.registrar && domain.expiration_date && (
                        <span className="text-xs text-slate-300">·</span>
                      )}
                      {editingExpiry === domain.id ? (
                        <span className="flex items-center gap-1">
                          <input
                            type="date"
                            value={expiryValue}
                            onChange={(e) => setExpiryValue(e.target.value)}
                            className="text-xs border border-slate-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-indigo-400"
                            autoFocus
                          />
                          <button
                            onClick={() => { updateMutation.mutate({ id: domain.id, data: { expiration_date: expiryValue } }); setEditingExpiry(null); }}
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button onClick={() => setEditingExpiry(null)} className="text-slate-400 hover:text-slate-600">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => { setEditingExpiry(domain.id); setExpiryValue(domain.expiration_date ? new Date(domain.expiration_date).toISOString().split("T")[0] : ""); }}
                          className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                        >
                          {domain.expiration_date ? `Expires ${format(new Date(domain.expiration_date), "MMM d, yyyy")}` : "Set expiry date"}
                          <Edit2 className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100" />
                        </button>
                      )}
                      {domain.auto_renew && (
                        <>
                          <span className="text-xs text-slate-300">·</span>
                          <span className="text-xs text-emerald-600 flex items-center gap-0.5">
                            <RefreshCw className="h-3 w-3" /> Auto-renew
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge className={`${expiry.className} border text-xs shrink-0`}>{expiry.label}</Badge>
                  {domain.website_link && (
                    <a href={domain.website_link} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-3.5 w-3.5 text-slate-400 hover:text-indigo-600" />
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteMutation.mutate(domain.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <DomainFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        companyId={company?.id}
        onSave={(data) => createMutation.mutateAsync(data)}
      />
    </div>
  );
}