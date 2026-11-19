import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, FlaskConical, Upload, X } from "lucide-react";

const DEFAULT = { version: "", date_created: "", supplier_name: "", changes_from_previous: "", testing_notes: "", file_urls: [] };

export default function PrototypeTab({ ideaId }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: prototypes = [] } = useQuery({
    queryKey: ["prototypes", ideaId],
    queryFn: () => base44.entities.Prototype.filter({ product_idea_id: ideaId }),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.Prototype.update(editing.id, data)
      : base44.entities.Prototype.create({ ...data, product_idea_id: ideaId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prototypes", ideaId] });
      setShowForm(false);
      setEditing(null);
      setForm(DEFAULT);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Prototype.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prototypes", ideaId] }),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    setForm(f => ({ ...f, file_urls: [...(f.file_urls || []), ...urls] }));
    setUploading(false);
  };

  const removeFile = (idx) => setForm(f => ({ ...f, file_urls: f.file_urls.filter((_, i) => i !== idx) }));
  const openEdit = (p) => { setEditing(p); setForm({ ...DEFAULT, ...p }); setShowForm(true); };
  const openNew = () => { setEditing(null); setForm(DEFAULT); setShowForm(true); };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800">Prototypes</h3>
        <Button size="sm" onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Prototype
        </Button>
      </div>

      {prototypes.length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="py-10 text-center text-slate-400">
            <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No prototypes logged yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {prototypes.map(p => (
            <Card key={p.id} className="border border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-semibold text-slate-800 text-sm">Version {p.version}</span>
                    {p.date_created && <span className="ml-2 text-xs text-slate-400">{p.date_created}</span>}
                    {p.supplier_name && <span className="ml-2 text-xs text-indigo-500">· {p.supplier_name}</span>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => openEdit(p)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(p.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {p.changes_from_previous && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-slate-500">Changes from Previous</p>
                    <p className="text-sm text-slate-700 mt-0.5">{p.changes_from_previous}</p>
                  </div>
                )}
                {p.testing_notes && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-slate-500">Testing Notes</p>
                    <p className="text-sm text-slate-700 mt-0.5">{p.testing_notes}</p>
                  </div>
                )}
                {p.file_urls?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {p.file_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline border border-indigo-200 rounded px-2 py-1 bg-indigo-50">
                        File {i + 1}
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={() => { setShowForm(false); setEditing(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Prototype" : "Add Prototype"}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Version *</Label><Input value={form.version} onChange={e => set("version", e.target.value)} placeholder="e.g. v1.0" className="mt-1" /></div>
              <div><Label>Date Created</Label><Input type="date" value={form.date_created} onChange={e => set("date_created", e.target.value)} className="mt-1" /></div>
              <div className="col-span-2"><Label>Supplier Name</Label><Input value={form.supplier_name} onChange={e => set("supplier_name", e.target.value)} className="mt-1" /></div>
              <div className="col-span-2"><Label>Changes from Previous Version</Label><Textarea value={form.changes_from_previous} onChange={e => set("changes_from_previous", e.target.value)} rows={2} className="mt-1" /></div>
              <div className="col-span-2"><Label>Testing Notes</Label><Textarea value={form.testing_notes} onChange={e => set("testing_notes", e.target.value)} rows={2} className="mt-1" /></div>
            </div>
            <div>
              <Label>Attach Files</Label>
              <div className="mt-1 border-2 border-dashed border-slate-200 rounded-lg p-3 text-center">
                <label className="cursor-pointer text-sm text-indigo-500 hover:underline flex items-center justify-center gap-1.5">
                  <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Click to upload"}
                  <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
              {form.file_urls?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.file_urls.map((url, i) => (
                    <div key={i} className="flex items-center gap-1 bg-slate-100 rounded px-2 py-1 text-xs">
                      <span className="text-slate-600 truncate max-w-[120px]">File {i + 1}</span>
                      <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-400"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
              <Button onClick={() => saveMutation.mutate(form)} disabled={!form.version.trim()} className="bg-indigo-600 hover:bg-indigo-700">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}