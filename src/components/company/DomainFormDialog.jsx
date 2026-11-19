import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

export default function DomainFormDialog({ open, onClose, companyId, onSave }) {
  const [form, setForm] = useState({
    domain_name: "", registrar: "", purchase_date: "", expiration_date: "",
    website_link: "", notes: "", auto_renew: false,
  });
  const [saving, setSaving] = useState(false);

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...form, company_id: companyId });
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Domain</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Domain Name *</Label>
            <Input value={form.domain_name} onChange={(e) => update("domain_name", e.target.value)} placeholder="example.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Registrar</Label>
              <Input value={form.registrar} onChange={(e) => update("registrar", e.target.value)} placeholder="GoDaddy, Namecheap..." />
            </div>
            <div className="space-y-1.5">
              <Label>Website Link</Label>
              <Input value={form.website_link} onChange={(e) => update("website_link", e.target.value)} placeholder="https://" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Purchase Date</Label>
              <Input type="date" value={form.purchase_date} onChange={(e) => update("purchase_date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Expiration Date</Label>
              <Input type="date" value={form.expiration_date} onChange={(e) => update("expiration_date", e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label>Auto Renew</Label>
            <Switch checked={form.auto_renew} onCheckedChange={(v) => update("auto_renew", v)} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.domain_name} className="bg-indigo-600 hover:bg-indigo-700">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Add Domain
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}