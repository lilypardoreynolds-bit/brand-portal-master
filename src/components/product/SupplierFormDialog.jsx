import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { Paperclip, X, Loader2, ExternalLink } from "lucide-react";

const EMPTY = {
  supplier_name: "",
  address: "",
  country: "",
  contact_person: "",
  email: "",
  phone: "",
  website: "",
  profile_link: "",
  license_document_urls: [],
  notes: "",
};

export default function SupplierFormDialog({ open, supplier, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(supplier ? { ...EMPTY, ...supplier } : EMPTY);
  }, [supplier, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    set("license_document_urls", [...(form.license_document_urls || []), ...urls]);
    setUploading(false);
    e.target.value = "";
  };

  const removeDoc = (idx) => {
    set("license_document_urls", form.license_document_urls.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!form.supplier_name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit Supplier" : "Register Supplier"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* Supplier Name */}
          <div className="space-y-1.5 md:col-span-2">
            <Label>Supplier Name *</Label>
            <Input placeholder="e.g. Shenzhen ABC Manufacturing" value={form.supplier_name} onChange={e => set("supplier_name", e.target.value)} />
          </div>

          {/* Address */}
          <div className="space-y-1.5 md:col-span-2">
            <Label>Address</Label>
            <Input placeholder="Full business address" value={form.address} onChange={e => set("address", e.target.value)} />
          </div>

          {/* Country */}
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Input placeholder="e.g. China" value={form.country} onChange={e => set("country", e.target.value)} />
          </div>

          {/* Contact Person */}
          <div className="space-y-1.5">
            <Label>Contact Person</Label>
            <Input placeholder="Full name" value={form.contact_person} onChange={e => set("contact_person", e.target.value)} />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" placeholder="supplier@email.com" value={form.email} onChange={e => set("email", e.target.value)} />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input placeholder="+1 555 000 0000" value={form.phone} onChange={e => set("phone", e.target.value)} />
          </div>

          {/* Profile Link */}
          <div className="space-y-1.5 md:col-span-2">
            <Label>Profile Link (Alibaba / Website)</Label>
            <Input type="url" placeholder="https://alibaba.com/..." value={form.profile_link} onChange={e => set("profile_link", e.target.value)} />
          </div>

          {/* License Documents */}
          <div className="space-y-2 md:col-span-2">
            <Label>License Documents <span className="text-slate-400 font-normal">(optional)</span></Label>
            <div className="flex flex-col gap-2">
              {(form.license_document_urls || []).map((url, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <Paperclip className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline truncate flex-1 flex items-center gap-1">
                    Document {i + 1} <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                  <button onClick={() => removeDoc(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <label className={`flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors text-sm text-slate-500 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                {uploading ? "Uploading..." : "Upload document"}
                <input type="file" multiple className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5 md:col-span-2">
            <Label>Notes</Label>
            <Textarea rows={3} placeholder="Additional notes..." value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!form.supplier_name.trim() || saving} onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving...</> : supplier ? "Update Supplier" : "Register Supplier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}