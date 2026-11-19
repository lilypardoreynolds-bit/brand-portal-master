import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Calendar, Paperclip, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const statusColors = {
  Planned: "bg-slate-100 text-slate-600",
  Created: "bg-blue-100 text-blue-700",
  Posted: "bg-emerald-100 text-emerald-700",
  Recording: "bg-amber-100 text-amber-700",
  Editing: "bg-violet-100 text-violet-700",
};

const typeColors = {
  Reel: "bg-pink-100 text-pink-700",
  Story: "bg-orange-100 text-orange-700",
  Carousel: "bg-indigo-100 text-indigo-700",
  Image: "bg-cyan-100 text-cyan-700",
  Video: "bg-red-100 text-red-700",
  Short: "bg-yellow-100 text-yellow-700",
  Pin: "bg-rose-100 text-rose-700",
};

const approvalColors = {
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
};

const ApprovalIcon = ({ status }) => {
  if (status === "approved") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
  if (status === "rejected") return <XCircle className="h-3.5 w-3.5 text-red-500" />;
  return <Clock className="h-3.5 w-3.5 text-amber-500" />;
};

export default function ContentPostCard({ post, onEdit, onDelete, onApprove }) {
  return (
    <Card className="border-slate-200 hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="font-medium text-slate-900 truncate">{post.title}</p>
              {post.post_type && <Badge className={cn("text-xs", typeColors[post.post_type] || "bg-slate-100 text-slate-600")}>{post.post_type}</Badge>}
              <Badge className={cn("text-xs", statusColors[post.status] || "bg-slate-100 text-slate-600")}>{post.status}</Badge>
            </div>
            {post.hook && <p className="text-sm text-slate-500 truncate">Hook: {post.hook}</p>}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
              {post.posting_date && (
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(post.posting_date), "MMM d, yyyy")}</span>
              )}
              {post.media_urls?.length > 0 && (
                <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" />{post.media_urls.length} file{post.media_urls.length > 1 ? "s" : ""}</span>
              )}
            </div>
            {/* Approval badge */}
            {onApprove && (
              <div className="mt-2 flex items-center gap-2">
                <Badge className={cn("text-xs flex items-center gap-1", approvalColors[post.approval_status || "pending"])}>
                  <ApprovalIcon status={post.approval_status || "pending"} />
                  {(post.approval_status || "pending").charAt(0).toUpperCase() + (post.approval_status || "pending").slice(1)}
                </Badge>
                {post.approval_notes && <span className="text-xs text-slate-400 truncate max-w-[120px]" title={post.approval_notes}>{post.approval_notes}</span>}
              </div>
            )}
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {onApprove && (
              <Button variant="ghost" size="icon" className="h-7 w-7" title="Review" onClick={() => onApprove(post)}>
                <CheckCircle2 className="h-3.5 w-3.5 text-slate-400 hover:text-emerald-600" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(post)}><Pencil className="h-3.5 w-3.5 text-slate-400" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(post)}><Trash2 className="h-3.5 w-3.5 text-slate-400" /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}