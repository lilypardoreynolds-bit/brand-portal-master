import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEFAULT = { channel_name: "", channel_type: "Online Store", platform: "", website_link: "", contact_person: "", notes: "", is_active: true };

export default function SalesChannelFormDialog({ open, onClose, channel, onSave }) {
  const [form, setForm] = useState(DEFAULT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(channel ? { ...DEFAULT, ...channel } : DEFAULT);
  }, [channel, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{channel ? "Edit Channel" : "Add Sales Channel"}</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          <div><Label>Channel Name *</Label><Input value={form.channel_name} onChange={e => set("channel_name", e.target.value)} className="mt-1" /></div>
          <div>
            <Label>Channel Type</Label>
            <Select value={form.channel_type} onValueChange={v => set("channel_type", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{["Online Store","Marketplace","Wholesale","Direct Sales"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Platform</Label><Input value={form.platform} onChange={e => set("platform", e.target.value)} placeholder="e.g. Shopify, Amazon" className="mt-1" /></div>
          <div><Label>Website Link</Label><Input value={form.website_link} onChange={e => set("website_link", e.target.value)} className="mt-1" /></div>
          <div><Label>Contact Person</Label><Input value={form.contact_person} onChange={e => set("contact_person", e.target.value)} className="mt-1" /></div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} className="mt-1" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.channel_name.trim()} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}