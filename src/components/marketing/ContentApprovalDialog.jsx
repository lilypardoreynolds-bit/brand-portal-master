import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function ContentApprovalDialog({ open, onClose, onSave, post }) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNotes(post?.approval_notes || "");
  }, [post, open]);

  const handleDecision = async (decision) => {
    setSaving(true);
    await onSave(post.id, { approval_status: decision, approval_notes: notes });
    setSaving(false);
    onClose();
  };

  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Review Content</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Post Summary */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-slate-900">{post.title}</p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              {post.post_type && <span className="capitalize bg-slate-200 text-slate-700 px-2 py-0.5 rounded">{post.post_type}</span>}
              <span className="capitalize bg-slate-200 text-slate-700 px-2 py-0.5 rounded">{post.channel_type}</span>
              {post.posting_date && <span>{format(new Date(post.posting_date), "MMM d, yyyy")}</span>}
            </div>
            {post.hook && <p className="text-sm text-slate-600"><span className="font-medium">Hook:</span> {post.hook}</p>}
            {post.script_notes && <p className="text-sm text-slate-600"><span className="font-medium">Script:</span> {post.script_notes}</p>}
            {post.description && <p className="text-sm text-slate-600"><span className="font-medium">Description:</span> {post.description}</p>}
          </div>

          <div className="space-y-1">
            <Label>Approval Notes (optional)</Label>
            <Textarea
              rows={3}
              placeholder="Leave feedback or notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button
            variant="outline"
            onClick={() => handleDecision("rejected")}
            disabled={saving}
            className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Reject
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button
              onClick={() => handleDecision("approved")}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Approve
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}