import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CheckCircle2, XCircle, Upload, X } from "lucide-react";

const TEST_TYPES = ["Quality", "User Experience", "Packaging", "Safety", "Durability"];
const DEFAULT = { test_date: "", test_type: "Quality", results: "", issues_found: "", improvements_needed: "", passed: false, file_urls: [] };

export default function TestingTab({ ideaId }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: tests = [] } = useQuery({
    queryKey: ["product_tests", ideaId],
    queryFn: () => base44.entities.ProductTest.filter({ product_idea_id: ideaId }),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.ProductTest.update(editing.id, data)
      : base44.entities.ProductTest.create({ ...data, product_idea_id: ideaId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product_tests", ideaId] });
      setShowForm(false);
      setEditing(null);
      setForm(DEFAULT);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductTest.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["product_tests", ideaId] }),
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

  const openEdit = (t) => { setEditing(t); setForm({ ...DEFAULT, ...t }); setShowForm(true); };
  const openNew = () => { setEditing(null); setForm(DEFAULT); setShowForm(true); };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800">Product Testing</h3>
        <Button size="sm" onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Test
        </Button>
      </div>

      {tests.length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="py-10 text-center text-slate-400">
            <p className="text-sm">No tests recorded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tests.map(t => (
            <Card key={t.id} className="border border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-slate-100 text-slate-700 border-0 text-xs">{t.test_type}</Badge>
                    {t.test_date && <span className="text-xs text-slate-400">{t.test_date}</span>}
                    {t.passed
                      ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3.5 w-3.5" />Passed</span>
                      : <span className="flex items-center gap-1 text-xs text-red-500"><XCircle className="h-3.5 w-3.5" />Failed</span>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => openEdit(t)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(t.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {t.results && <div className="mb-1"><p className="text-xs font-medium text-slate-500">Results</p><p className="text-sm text-slate-700">{t.results}</p></div>}
                {t.issues_found && <div className="mb-1"><p className="text-xs font-medium text-slate-500">Issues Found</p><p className="text-sm text-red-600">{t.issues_found}</p></div>}
                {t.improvements_needed && <div><p className="text-xs font-medium text-slate-500">Improvements Needed</p><p className="text-sm text-orange-600">{t.improvements_needed}</p></div>}
                {t.file_urls?.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {t.file_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline border border-indigo-200 rounded px-2 py-1 bg-indigo-50">
                        File {i+1}
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
          <DialogHeader><DialogTitle>{editing ? "Edit Test" : "Add Test"}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Test Type</Label>
                <Select value={form.test_type} onValueChange={v => set("test_type", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{TEST_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Test Date</Label><Input type="date" value={form.test_date} onChange={e => set("test_date", e.target.value)} className="mt-1" /></div>
              <div className="col-span-2"><Label>Results</Label><Textarea value={form.results} onChange={e => set("results", e.target.value)} rows={2} className="mt-1" /></div>
              <div className="col-span-2"><Label>Issues Found</Label><Textarea value={form.issues_found} onChange={e => set("issues_found", e.target.value)} rows={2} className="mt-1" /></div>
              <div className="col-span-2"><Label>Improvements Needed</Label><Textarea value={form.improvements_needed} onChange={e => set("improvements_needed", e.target.value)} rows={2} className="mt-1" /></div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="passed" checked={form.passed} onChange={e => set("passed", e.target.checked)} className="h-4 w-4 accent-indigo-600" />
                <Label htmlFor="passed" className="cursor-pointer">Test Passed</Label>
              </div>
            </div>
            <div>
              <Label>Attach Photos / Documents</Label>
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
                      <span className="text-slate-600">File {i + 1}</span>
                      <button onClick={() => setForm(f => ({ ...f, file_urls: f.file_urls.filter((_, idx) => idx !== i) }))} className="text-slate-400 hover:text-red-400">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
              <Button onClick={() => saveMutation.mutate(form)} className="bg-indigo-600 hover:bg-indigo-700">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}