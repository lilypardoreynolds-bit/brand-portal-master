import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, FileText, Upload, AlertTriangle, ExternalLink } from "lucide-react";
import { differenceInDays, format } from "date-fns";

const CATEGORIES = ["Resale Certificate","Sales Tax Permit","Filed Tax Report","Confirmation Receipt","State Tax Letter","Other Tax Document"];
const STATUSES = ["Active","Expired","Pending Renewal"];
const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
const EMPTY = { document_name: "", category: "", state: "", issue_date: "", expiration_date: "", status: "Active", notes: "", file_url: "" };

const CAT_COLORS = {
  "Resale Certificate": "bg-purple-100 text-purple-700",
  "Sales Tax Permit": "bg-blue-100 text-blue-700",
  "Filed Tax Report": "bg-emerald-100 text-emerald-700",
  "Confirmation Receipt": "bg-teal-100 text-teal-700",
  "State Tax Letter": "bg-orange-100 text-orange-700",
  "Other Tax Document": "bg-slate-100 text-slate-700",
};

export default function TaxDocuments() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { data: docs = [] } = useQuery({
    queryKey: ["tax_documents"],
    queryFn: () => base44.entities.TaxDocument.list("-created_date"),
    initialData: [],
  });

  const save = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.TaxDocument.update(editing, data)
      : base44.entities.TaxDocument.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tax_documents"] }); setOpen(false); setEditing(null); setForm(EMPTY); },
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.TaxDocument.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tax_documents"] }),
  });

  const openNew = () => { setForm(EMPTY); setEditing(null); setOpen(true); };
  const openEdit = (d) => { setForm(d); setEditing(d.id); setOpen(true); };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, file_url }));
    setUploading(false);
  };

  const getExpiryAlert = (doc) => {
    if (!doc.expiration_date) return null;
    const days = differenceInDays(new Date(doc.expiration_date), new Date());
    if (days < 0) return { label: "Expired", color: "text-red-600 bg-red-50 border-red-200" };
    if (days <= 30) return { label: `Expires in ${days}d`, color: "text-amber-700 bg-amber-50 border-amber-200" };
    if (days <= 90) return { label: `Expires in ${days}d`, color: "text-yellow-700 bg-yellow-50 border-yellow-200" };
    return null;
  };

  const expiringSoon = docs.filter(d => {
    if (!d.expiration_date) return false;
    return differenceInDays(new Date(d.expiration_date), new Date()) <= 30;
  });

  return (
    <div className="space-y-4">
      {expiringSoon.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{expiringSoon.length} document{expiringSoon.length > 1 ? "s" : ""}</strong> expiring within 30 days: {expiringSoon.map(d => d.document_name).join(", ")}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Tax Documents</h3>
        <Button onClick={openNew} size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Add Document</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.length === 0 && (
          <div className="col-span-3 text-center py-12 text-slate-400">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No tax documents yet. Add your first document.</p>
          </div>
        )}
        {docs.map(doc => {
          const alert = getExpiryAlert(doc);
          return (
            <Card key={doc.id} className={`border ${alert ? "border-amber-300" : "border-slate-200"}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{doc.document_name}</p>
                    {doc.state && <p className="text-xs text-slate-400 mt-0.5">State: {doc.state}</p>}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(doc)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => del.mutate(doc.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>

                <Badge className={`text-[10px] ${CAT_COLORS[doc.category] || "bg-slate-100 text-slate-700"} mb-3`}>{doc.category}</Badge>

                <div className="space-y-1 text-xs text-slate-500">
                  {doc.issue_date && <p>Issued: {format(new Date(doc.issue_date), "MMM d, yyyy")}</p>}
                  {doc.expiration_date && <p>Expires: {format(new Date(doc.expiration_date), "MMM d, yyyy")}</p>}
                </div>

                {alert && (
                  <div className={`mt-3 flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md border ${alert.color}`}>
                    <AlertTriangle className="h-3 w-3" /> {alert.label}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3">
                  <Badge variant="outline" className={doc.status === "Active" ? "text-emerald-600 border-emerald-300" : doc.status === "Expired" ? "text-red-600 border-red-300" : "text-amber-600 border-amber-300"}>
                    {doc.status}
                  </Badge>
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Tax Document</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Document Name *</label><Input value={form.document_name} onChange={e => setForm(f => ({ ...f, document_name: e.target.value }))} /></div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Category *</label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">State</label>
                <Select value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v }))}>
                  <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                  <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Status</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Issue Date</label><Input type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Expiration Date</label><Input type="date" value={form.expiration_date} onChange={e => setForm(f => ({ ...f, expiration_date: e.target.value }))} /></div>
            </div>
            <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Notes</label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Upload File</label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-1.5 relative" disabled={uploading}>
                  <Upload className="h-3.5 w-3.5" /> {uploading ? "Uploading..." : "Upload PDF / Image"}
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </Button>
                {form.file_url && <a href={form.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">View uploaded file</a>}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending}>{save.isPending ? "Saving..." : "Save Document"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}