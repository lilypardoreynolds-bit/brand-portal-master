import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Truck, ExternalLink, Pencil, Trash2 } from "lucide-react";
import SupplierFormDialog from "@/components/product/SupplierFormDialog";

export default function Suppliers() {
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const queryClient = useQueryClient();

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => base44.entities.Supplier.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Supplier.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["suppliers"] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Supplier.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["suppliers"] }); setShowForm(false); setEditingSupplier(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Supplier.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Suppliers</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your registered manufacturers and suppliers</p>
        </div>
        <Button onClick={() => { setEditingSupplier(null); setShowForm(true); }} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-1" /> Register Supplier
        </Button>
      </div>

      {/* Supplier Cards */}
      {suppliers.length === 0 ? (
        <div className="text-center py-20 text-slate-400 border border-dashed border-slate-200 rounded-xl">
          <Truck className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No suppliers registered yet.</p>
          <p className="text-xs mt-1">Click "Register Supplier" to add your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {suppliers.map(s => (
            <Card key={s.id} className="border border-slate-200 hover:border-indigo-200 transition-colors">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800">{s.supplier_name}</p>
                    {s.country && <p className="text-xs text-slate-400">{s.country}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingSupplier(s); setShowForm(true); }}>
                      <Pencil className="h-3.5 w-3.5 text-slate-400" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (confirm(`Delete "${s.supplier_name}"?`)) deleteMutation.mutate(s.id); }}>
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  {s.address && <p>📍 {s.address}</p>}
                  {s.contact_person && <p>👤 {s.contact_person}</p>}
                  {s.email && <p>✉️ {s.email}</p>}
                  {s.phone && <p>📞 {s.phone}</p>}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {s.profile_link && (
                    <a href={s.profile_link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline bg-indigo-50 px-2 py-1 rounded-md">
                      <ExternalLink className="h-3 w-3" /> Profile
                    </a>
                  )}
                  {(s.license_document_urls || []).map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:underline bg-slate-100 px-2 py-1 rounded-md">
                      📄 Doc {i + 1}
                    </a>
                  ))}
                </div>

                {s.notes && <p className="text-xs text-slate-400 italic border-t border-slate-100 pt-2">{s.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SupplierFormDialog
        open={showForm}
        supplier={editingSupplier}
        onClose={() => { setShowForm(false); setEditingSupplier(null); }}
        onSave={(data) => {
          if (editingSupplier) updateMutation.mutate({ id: editingSupplier.id, data });
          else createMutation.mutate(data);
        }}
      />
    </div>
  );
}