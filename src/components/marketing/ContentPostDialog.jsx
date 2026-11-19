import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const POST_TYPES_BY_CHANNEL = {
  instagram: ["Reel", "Story", "Carousel", "Image"],
  tiktok: ["Video", "Short"],
  youtube: ["Video"],
  pinterest: ["Pin"],
  general: ["Reel", "Story", "Carousel", "Image", "Video", "Short", "Pin"],
};

const STATUSES = ["Planned", "Created", "Posted", "Recording", "Editing"];
const RECORDING_STATUSES = ["Not Started", "In Progress", "Done"];

const DEFAULT = { title: "", post_type: "", hook: "", script_notes: "", description: "", link: "", posting_date: "", status: "Planned", recording_status: "Not Started", thumbnail_url: "" };

export default function ContentPostDialog({ open, onClose, onSave, post, channelType }) {
  const [form, setForm] = useState(DEFAULT);
  const [saving, setSaving] = useState(false);
  const types = POST_TYPES_BY_CHANNEL[channelType] || POST_TYPES_BY_CHANNEL.general;

  useEffect(() => { setForm(post ? { ...DEFAULT, ...post } : { ...DEFAULT, channel_type: channelType }); }, [post, open]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...form, channel_type: channelType });
    setSaving(false);
  };

  const showTikTok = channelType === "tiktok";
  const showYouTube = channelType === "youtube";
  const showPinterest = channelType === "pinterest";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{post ? "Edit Post" : "New Post"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1"><Label>Title *</Label><Input value={form.title} onChange={e => set("title", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Post Type</Label>
              <Select value={form.post_type} onValueChange={v => set("post_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1"><Label>Posting Date</Label><Input type="date" value={form.posting_date} onChange={e => set("posting_date", e.target.value)} /></div>
          {(showTikTok || channelType === "instagram") && (
            <div className="space-y-1"><Label>Hook</Label><Input placeholder="Opening hook line..." value={form.hook} onChange={e => set("hook", e.target.value)} /></div>
          )}
          {(showTikTok || channelType === "instagram") && (
            <div className="space-y-1"><Label>Script Notes</Label><Textarea rows={3} value={form.script_notes} onChange={e => set("script_notes", e.target.value)} /></div>
          )}
          {showTikTok && (
            <div className="space-y-1">
              <Label>Recording Status</Label>
              <Select value={form.recording_status} onValueChange={v => set("recording_status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RECORDING_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {(showYouTube || !showTikTok) && channelType !== "instagram" && channelType !== "tiktok" && (
            <div className="space-y-1"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={e => set("description", e.target.value)} /></div>
          )}
          {showPinterest && (
            <div className="space-y-1"><Label>Link</Label><Input placeholder="https://..." value={form.link} onChange={e => set("link", e.target.value)} /></div>
          )}
          {showYouTube && (
            <div className="space-y-1"><Label>Thumbnail URL</Label><Input placeholder="https://..." value={form.thumbnail_url} onChange={e => set("thumbnail_url", e.target.value)} /></div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.title} className="bg-indigo-600 hover:bg-indigo-700">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}