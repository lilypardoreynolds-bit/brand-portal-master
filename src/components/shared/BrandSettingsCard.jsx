import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Warehouse, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppSettings, MAIN_WAREHOUSE } from "@/lib/appSettings";

function ListEditor({ label, items, onChange, locked = [], placeholder }) {
  const [value, setValue] = useState("");
  const add = () => {
    const v = value.trim();
    if (!v || items.includes(v)) return;
    onChange([...items, v]);
    setValue("");
  };
  return (
    <div className="space-y-2">
      <Label className="text-xs text-slate-600">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {items.map((it) => (
          <Badge key={it} variant="outline" className="gap-1 py-1 px-2 text-sm bg-slate-50">
            {it}
            {!locked.includes(it) && (
              <button type="button" onClick={() => onChange(items.filter((x) => x !== it))} className="text-slate-400 hover:text-red-600">
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} placeholder={placeholder} className="h-9" />
        <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1 h-9"><Plus className="h-3.5 w-3.5" />Add</Button>
      </div>
    </div>
  );
}

/** Per-brand configuration: replaces values that used to be hard-coded in one brand's portal. */
export default function BrandSettingsCard() {
  const { settings, warehouses, salesChannels, defaultTaxRate, save, isLoading } = useAppSettings();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setForm({
        brand_name: settings.brand_name || "",
        warehouses,
        sales_channels: salesChannels,
        default_tax_rate: defaultTaxRate,
        invoice_legal_footer: settings.invoice_legal_footer || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, settings?.id]);

  if (!form) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await save({ ...form, default_tax_rate: Number(form.default_tax_rate) || 0 });
      toast.success("Brand settings saved");
    } catch (e) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Warehouse className="h-4 w-4 text-slate-500" />
          <CardTitle className="text-base">Brand Settings</CardTitle>
        </div>
        <p className="text-xs text-slate-500">These options are specific to this brand and feed the dropdowns across the portal.</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Brand name</Label>
            <Input value={form.brand_name} onChange={(e) => setForm({ ...form, brand_name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Default sales tax rate (%)</Label>
            <Input type="number" step="0.01" value={form.default_tax_rate} onChange={(e) => setForm({ ...form, default_tax_rate: e.target.value })} />
          </div>
        </div>
        <ListEditor
          label="Warehouses / storage locations"
          items={form.warehouses}
          locked={[MAIN_WAREHOUSE]}
          placeholder="e.g. Amazon FBA, 3PL Miami..."
          onChange={(warehouses) => setForm({ ...form, warehouses })}
        />
        <ListEditor
          label="Sales channels reported"
          items={form.sales_channels}
          placeholder="e.g. Amazon, TikTok Shop..."
          onChange={(sales_channels) => setForm({ ...form, sales_channels })}
        />
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-600">Default invoice legal footer</Label>
          <Input value={form.invoice_legal_footer} onChange={(e) => setForm({ ...form, invoice_legal_footer: e.target.value })} placeholder="Optional" />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save brand settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
