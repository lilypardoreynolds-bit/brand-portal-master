import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const PLATFORMS = ["Instagram", "TikTok", "YouTube", "Pinterest", "Multi-Platform"];
const STATUSES = ["Prospect", "Outreach Sent", "Negotiating", "Active", "Completed", "Declined"];

const DEFAULT = { name: "", platform: "Instagram", followers: 0, contact_email: "", commission_rate: 0, partnership_status: "Prospect", campaign_name: "", content_posted: "", sales_generated: 0, commission_paid: 0, notes: "" };

export default function InfluencerFormDialog({ open, onClose, onSave, influencer }) {
  const [form, setForm] = useState(DEFAULT);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(influencer ? { ...DEFAULT, ...influencer } : DEFAULT); }, [influencer, open]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setNum = (k, v) => set(k, parseFloat(v) || 0);

  const handleSave = async () => { setSaving(true); await onSave(form); setSaving(false); };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{influencer ? "Edit Influencer" : "Add Influencer / Affiliate"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><Label>Name *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} /></div>
            <div className="space-y-1">
              <Label>Platform</Label>
              <Select value={form.platform} onValueChange={v => set("platform", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Partnership Status</Label>
              <Select value={form.partnership_status} onValueChange={v => set("partnership_status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Followers</Label><Input type="number" value={form.followers} onChange={e => setNum("followers", e.target.value)} /></div>
            <div className="space-y-1"><Label>Commission Rate (%)</Label><Input type="number" step="0.1" value={form.commission_rate} onChange={e => setNum("commission_rate", e.target.value)} /></div>
            <div className="col-span-2 space-y-1"><Label>Contact Email</Label><Input type="email" value={form.contact_email} onChange={e => set("contact_email", e.target.value)} /></div>
            <div className="col-span-2 space-y-1"><Label>Campaign Name</Label><Input value={form.campaign_name} onChange={e => set("campaign_name", e.target.value)} /></div>
            <div className="col-span-2 space-y-1"><Label>Content Posted (links / notes)</Label><Textarea rows={2} value={form.content_posted} onChange={e => set("content_posted", e.target.value)} /></div>
            <div className="space-y-1"><Label>Sales Generated ($)</Label><Input type="number" value={form.sales_generated} onChange={e => setNum("sales_generated", e.target.value)} /></div>
            <div className="space-y-1"><Label>Commission Paid ($)</Label><Input type="number" value={form.commission_paid} onChange={e => setNum("commission_paid", e.target.value)} /></div>
            <div className="col-span-2 space-y-1"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name} className="bg-indigo-600 hover:bg-indigo-700">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}