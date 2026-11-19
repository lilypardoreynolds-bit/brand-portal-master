import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Upload, X } from "lucide-react";

const DEFAULT = {
  name: "", sku: "", category: "", description: "", image_url: "",
  supplier_name: "", supplier_address: "", supplier_country: "",
  supplier_contact_person: "", supplier_email: "", supplier_phone: "",
  supplier_profile_link: "", supplier_license_urls: [],
  manufacturing_cost: 0, packaging_cost: 0, shipping_cost: 0,
  import_duties_cost: 0, fulfillment_cost: 0, storage_cost: 0,
  marketplace_fees: 0, marketing_cost_per_unit: 0, other_costs: 0,
  wholesale_price: 0, retail_price: 0, target_profit_margin: 30,
  pricing_strategy_notes: "", status: "active", notes: ""
};

export default function ProductFormDialog({ open, onClose, product, onSave }) {
  const [form, setForm] = useState(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers_list"],
    queryFn: () => base44.entities.Supplier.list("supplier_name"),
  });

  const handleSupplierSelect = (supplierId) => {
    if (supplierId === "__manual__") return;
    const s = suppliers.find(s => s.id === supplierId);
    if (!s) return;
    setForm(f => ({
      ...f,
      supplier_name: s.supplier_name || "",
      supplier_address: s.address || "",
      supplier_country: s.country || "",
      supplier_contact_person: s.contact_person || "",
      supplier_email: s.email || "",
      supplier_phone: s.phone || "",
      supplier_profile_link: s.profile_link || "",
      supplier_license_urls: s.license_document_urls || [],
    }));
  };

  useEffect(() => {
    setForm(product ? { ...DEFAULT, ...product } : DEFAULT);
  }, [product, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("image_url", file_url);
    setUploadingImage(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("supplier_license_urls", [...(form.supplier_license_urls || []), file_url]);
    setUploading(false);
  };

  const removeLicense = (idx) => {
    set("supplier_license_urls", form.supplier_license_urls.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Create New Product"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Product Name *</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} className="mt-1" placeholder="Enter product name..." />
            </div>
            <div>
              <Label>SKU</Label>
              <Input value={form.sku} onChange={e => set("sku", e.target.value)} className="mt-1" placeholder="e.g. SKU-001..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Input value={form.category} onChange={e => set("category", e.target.value)} className="mt-1" placeholder="Product category..." />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} className="mt-1" placeholder="Product description..." />
          </div>

          <div>
            <Label>Product Image</Label>
            <div className="mt-1 flex items-start gap-3">
              {form.image_url && (
                <div className="relative">
                  <img src={form.image_url} alt="Product" className="h-20 w-20 object-cover rounded border" />
                  <button onClick={() => set("image_url", "")} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              )}
              <label className="flex-1 flex items-center gap-2 p-3 border-2 border-dashed rounded cursor-pointer hover:bg-slate-50">
                <Upload className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-600">{uploadingImage ? "Uploading..." : form.image_url ? "Replace image" : "Upload image"}</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
              </label>
            </div>
          </div>

          {/* Supplier Section */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-3">Supplier Information</h3>
            <div className="space-y-3">
              {suppliers.length > 0 && (
                <div>
                  <Label className="text-xs">Select from registered suppliers</Label>
                  <Select onValueChange={handleSupplierSelect}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose a supplier to auto-fill..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__manual__">— Enter manually —</SelectItem>
                      {suppliers.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.supplier_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-xs">Supplier Name</Label>
                <Input value={form.supplier_name} onChange={e => set("supplier_name", e.target.value)} className="mt-1" placeholder="e.g. Shenzhen ABC Manufacturing" />
              </div>
              <div>
                <Label className="text-xs">Address</Label>
                <Input value={form.supplier_address} onChange={e => set("supplier_address", e.target.value)} className="mt-1" placeholder="Full business address" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Country</Label>
                  <Input value={form.supplier_country} onChange={e => set("supplier_country", e.target.value)} className="mt-1" placeholder="e.g. China" />
                </div>
                <div>
                  <Label className="text-xs">Contact Person</Label>
                  <Input value={form.supplier_contact_person} onChange={e => set("supplier_contact_person", e.target.value)} className="mt-1" placeholder="Full name" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input type="email" value={form.supplier_email} onChange={e => set("supplier_email", e.target.value)} className="mt-1" placeholder="supplier@email.com" />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input value={form.supplier_phone} onChange={e => set("supplier_phone", e.target.value)} className="mt-1" placeholder="+1 555 000 0000" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Profile Link (Alibaba / Website)</Label>
                <Input value={form.supplier_profile_link} onChange={e => set("supplier_profile_link", e.target.value)} className="mt-1" placeholder="https://alibaba.com/..." />
              </div>
              <div>
                <Label className="text-xs">License Documents (optional)</Label>
                <div className="mt-2 space-y-2">
                  {form.supplier_license_urls?.map((url, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded border">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 truncate hover:underline">
                        Document {idx + 1}
                      </a>
                      <button onClick={() => removeLicense(idx)} className="text-red-500 hover:text-red-700">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <label className="flex items-center gap-2 p-2 border-2 border-dashed rounded cursor-pointer hover:bg-slate-50">
                    <Upload className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-600">{uploading ? "Uploading..." : "Upload document"}</span>
                    <input type="file" onChange={handleFileUpload} disabled={uploading} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Costs Section */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-3">Costs</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Manufacturing Cost</Label>
                <Input type="number" min="0" step="0.01" value={form.manufacturing_cost} onChange={e => set("manufacturing_cost", Number(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Packaging Cost</Label>
                <Input type="number" min="0" step="0.01" value={form.packaging_cost} onChange={e => set("packaging_cost", Number(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Shipping Cost</Label>
                <Input type="number" min="0" step="0.01" value={form.shipping_cost} onChange={e => set("shipping_cost", Number(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Import Duties</Label>
                <Input type="number" min="0" step="0.01" value={form.import_duties_cost} onChange={e => set("import_duties_cost", Number(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Fulfillment Cost</Label>
                <Input type="number" min="0" step="0.01" value={form.fulfillment_cost} onChange={e => set("fulfillment_cost", Number(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Storage Cost</Label>
                <Input type="number" min="0" step="0.01" value={form.storage_cost} onChange={e => set("storage_cost", Number(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Marketplace Fees</Label>
                <Input type="number" min="0" step="0.01" value={form.marketplace_fees} onChange={e => set("marketplace_fees", Number(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Marketing Cost per Unit</Label>
                <Input type="number" min="0" step="0.01" value={form.marketing_cost_per_unit} onChange={e => set("marketing_cost_per_unit", Number(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Other Costs</Label>
                <Input type="number" min="0" step="0.01" value={form.other_costs} onChange={e => set("other_costs", Number(e.target.value))} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-3">Pricing</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Wholesale Price</Label>
                <Input type="number" min="0" step="0.01" value={form.wholesale_price} onChange={e => set("wholesale_price", Number(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Retail Price</Label>
                <Input type="number" min="0" step="0.01" value={form.retail_price} onChange={e => set("retail_price", Number(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Target Margin (%)</Label>
                <Input type="number" min="0" max="100" step="0.1" value={form.target_profit_margin} onChange={e => set("target_profit_margin", Number(e.target.value))} className="mt-1" />
              </div>
            </div>
          </div>

          <div>
            <Label>Pricing Strategy Notes</Label>
            <Textarea value={form.pricing_strategy_notes} onChange={e => set("pricing_strategy_notes", e.target.value)} rows={2} className="mt-1" placeholder="Channel-specific pricing, discount floors, etc..." />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} className="mt-1" placeholder="Additional notes..." />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? "Saving..." : "Save Product"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}