import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { Paperclip, X, Loader2, FileText } from "lucide-react";

const DEFAULT = { customer_name: "", company_name: "", email: "", phone: "", address: "", city: "", state: "", zip_code: "", country: "", ship_to_address: "", ship_to_city: "", ship_to_state: "", ship_to_zip: "", ship_to_country: "", customer_type: "Retail", tax_exempt: false, tax_exempt_certificate: "", tax_exempt_expiry: "", tax_exempt_file_url: "", notes: "" };

export default function CustomerFormDialog({ open, onClose, customer, onSave }) {
  const [form, setForm] = useState(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setForm(customer ? { ...DEFAULT, ...customer } : DEFAULT);
  }, [customer, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("tax_exempt_file_url", file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{customer ? "Edit Customer" : "Add Customer"}</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          <div><Label>Customer Name *</Label><Input value={form.customer_name} onChange={e => set("customer_name", e.target.value)} className="mt-1" /></div>
          <div><Label>Company Name</Label><Input value={form.company_name} onChange={e => set("company_name", e.target.value)} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Email</Label><Input value={form.email} onChange={e => set("email", e.target.value)} className="mt-1" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} className="mt-1" /></div>
          </div>
          <div><Label>Address</Label><Input value={form.address} onChange={e => set("address", e.target.value)} className="mt-1" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>City</Label><Input value={form.city} onChange={e => set("city", e.target.value)} className="mt-1" /></div>
            <div><Label>State</Label><Input value={form.state} onChange={e => set("state", e.target.value)} className="mt-1" /></div>
            <div><Label>ZIP Code</Label><Input value={form.zip_code} onChange={e => set("zip_code", e.target.value)} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div><Label>Country</Label><Input value={form.country} onChange={e => set("country", e.target.value)} className="mt-1" /></div>
             <div>
               <Label>Customer Type</Label>
               <Select value={form.customer_type} onValueChange={v => set("customer_type", v)}>
                 <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                 <SelectContent>{["Retail","Wholesale","Distributor"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
               </Select>
             </div>
           </div>
           {/* Shipping Address */}
           <div className="border-t border-slate-200 pt-3">
             <h3 className="text-sm font-semibold text-slate-700 mb-3">Shipping Address (Optional)</h3>
             <div><Label className="text-xs">Address</Label><Input value={form.ship_to_address} onChange={e => set("ship_to_address", e.target.value)} className="mt-1" /></div>
             <div className="grid grid-cols-3 gap-3 mt-3">
               <div><Label className="text-xs">City</Label><Input value={form.ship_to_city} onChange={e => set("ship_to_city", e.target.value)} className="mt-1" /></div>
               <div><Label className="text-xs">State</Label><Input value={form.ship_to_state} onChange={e => set("ship_to_state", e.target.value)} className="mt-1" /></div>
               <div><Label className="text-xs">ZIP Code</Label><Input value={form.ship_to_zip} onChange={e => set("ship_to_zip", e.target.value)} className="mt-1" /></div>
             </div>
             <div className="mt-3"><Label className="text-xs">Country</Label><Input value={form.ship_to_country} onChange={e => set("ship_to_country", e.target.value)} className="mt-1" /></div>
           </div>
          {/* Tax Exempt */}
          <div className="border border-slate-200 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Tax Exempt</Label>
                <p className="text-xs text-slate-400 mt-0.5">Customer does not pay sales tax</p>
              </div>
              <Switch checked={!!form.tax_exempt} onCheckedChange={v => set("tax_exempt", v)} />
            </div>
            {form.tax_exempt && (
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-500">Certificate Number</Label>
                    <Input value={form.tax_exempt_certificate} onChange={e => set("tax_exempt_certificate", e.target.value)} placeholder="e.g. TX-123456" className="mt-1 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Expiry Date</Label>
                    <Input type="date" value={form.tax_exempt_expiry} onChange={e => set("tax_exempt_expiry", e.target.value)} className="mt-1 text-sm" />
                  </div>
                </div>
                {/* File attachment */}
                <div>
                  <Label className="text-xs text-slate-500">Certificate Document</Label>
                  <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileUpload} />
                  {form.tax_exempt_file_url ? (
                    <div className="mt-1 flex items-center gap-2 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                      <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <a href={form.tax_exempt_file_url} target="_blank" rel="noreferrer" className="text-xs text-green-700 hover:underline truncate flex-1">View Uploaded File</a>
                      <button onClick={() => set("tax_exempt_file_url", "")} className="text-slate-400 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="mt-1 w-full flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-md px-3 py-2 text-xs text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                    >
                      {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
                      {uploading ? "Uploading..." : "Attach PDF or Image"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} className="mt-1" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.customer_name.trim()} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}