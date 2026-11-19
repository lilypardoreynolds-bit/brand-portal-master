import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Globe, Mail, Package } from "lucide-react";

const DEFAULT = { supplier_name: "", country: "", contact_person: "", email: "", phone: "", website: "", minimum_order_quantity: "", price_per_unit: "", lead_time: "", notes: "" };

export default function SupplierTab({ ideaId }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT);
  const queryClient = useQueryClient();

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers", ideaId],
    queryFn: () => base44.entities.Supplier.filter({ product_idea_id: ideaId }),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.Supplier.update(editing.id, data)
      : base44.entities.Supplier.create({ ...data, product_idea_id: ideaId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers", ideaId] });
      setShowForm(false);
      setEditing(null);
      setForm(DEFAULT);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Supplier.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suppliers", ideaId] }),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openEdit = (s) => { setEditing(s); setForm({ ...DEFAULT, ...s }); setShowForm(true); };
  const openNew = () => { setEditing(null); setForm(DEFAULT); setShowForm(true); };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800">Supplier Research</h3>
        <Button size="sm" onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Supplier
        </Button>
      </div>

      {suppliers.length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="py-10 text-center text-slate-400">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No suppliers added yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {suppliers.map(s => (
            <Card key={s.id} className="border border-slate-200">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{s.supplier_name}</p>
                    {s.country && <p className="text-xs text-slate-400">{s.country}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => openEdit(s)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(s.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  {s.contact_person && <div><span className="text-slate-400">Contact:</span> {s.contact_person}</div>}
                  {s.minimum_order_quantity && <div><span className="text-slate-400">MOQ:</span> {s.minimum_order_quantity}</div>}
                  {s.price_per_unit && <div><span className="text-slate-400">Price/Unit:</span> ${s.price_per_unit}</div>}
                  {s.lead_time && <div><span className="text-slate-400">Lead Time:</span> {s.lead_time}</div>}
                </div>
                <div className="flex gap-3 pt-1">
                  {s.email && <a href={`mailto:${s.email}`} className="text-xs text-indigo-500 hover:underline flex items-center gap-1"><Mail className="h-3 w-3" />{s.email}</a>}
                  {s.website && <a href={s.website} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center gap-1"><Globe className="h-3 w-3" />Website</a>}
                </div>
                {s.notes && <p className="text-xs text-slate-500 border-t border-slate-100 pt-2">{s.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={() => { setShowForm(false); setEditing(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Supplier" : "Add Supplier"}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Supplier Name *</Label><Input value={form.supplier_name} onChange={e => set("supplier_name", e.target.value)} className="mt-1" /></div>
              <div><Label>Country</Label><Input value={form.country} onChange={e => set("country", e.target.value)} className="mt-1" /></div>
              <div><Label>Contact Person</Label><Input value={form.contact_person} onChange={e => set("contact_person", e.target.value)} className="mt-1" /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={e => set("email", e.target.value)} className="mt-1" /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} className="mt-1" /></div>
              <div className="col-span-2"><Label>Website</Label><Input value={form.website} onChange={e => set("website", e.target.value)} className="mt-1" /></div>
              <div><Label>Min. Order Qty</Label><Input type="number" value={form.minimum_order_quantity} onChange={e => set("minimum_order_quantity", e.target.value)} className="mt-1" /></div>
              <div><Label>Price per Unit ($)</Label><Input type="number" value={form.price_per_unit} onChange={e => set("price_per_unit", e.target.value)} className="mt-1" /></div>
              <div className="col-span-2"><Label>Lead Time</Label><Input value={form.lead_time} onChange={e => set("lead_time", e.target.value)} placeholder="e.g. 30 days" className="mt-1" /></div>
              <div className="col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} className="mt-1" /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
              <Button onClick={() => saveMutation.mutate(form)} disabled={!form.supplier_name.trim()} className="bg-indigo-600 hover:bg-indigo-700">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}