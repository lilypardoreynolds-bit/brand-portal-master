import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pencil, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ContentPostCard from "./ContentPostCard";
import ContentPostDialog from "./ContentPostDialog";

const DEFAULT_CHANNEL = (type) => ({
  channel_type: type, handle_or_url: "", followers: 0, engagement_rate: 0,
  avg_views: 0, monthly_views: 0, subscribers: 0, posting_frequency: "",
  video_frequency: "", content_strategy_notes: "", boards: "",
});

export default function SocialChannelPage({ channelType, title, icon: Icon, color, bg, fields }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const qc = useQueryClient();

  const { data: channels = [] } = useQuery({
    queryKey: ["mkt_channel", channelType],
    queryFn: () => base44.entities.MarketingChannel.filter({ channel_type: channelType }),
    initialData: [],
  });
  const channel = channels[0] || null;

  const { data: posts = [] } = useQuery({
    queryKey: ["content_posts", channelType],
    queryFn: () => base44.entities.ContentPost.filter({ channel_type: channelType }),
    initialData: [],
  });

  const saveChanMutation = useMutation({
    mutationFn: (data) => channel ? base44.entities.MarketingChannel.update(channel.id, data) : base44.entities.MarketingChannel.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mkt_channel", channelType] }); setEditing(false); },
  });

  const savePostMutation = useMutation({
    mutationFn: (data) => editPost ? base44.entities.ContentPost.update(editPost.id, data) : base44.entities.ContentPost.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["content_posts", channelType] }); setShowPostDialog(false); setEditPost(null); },
  });

  const deletePostMutation = useMutation({
    mutationFn: (id) => base44.entities.ContentPost.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content_posts", channelType] }),
  });

  const startEdit = () => { setForm({ ...DEFAULT_CHANNEL(channelType), ...channel }); setEditing(true); };
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const displayData = editing ? form : (channel || DEFAULT_CHANNEL(channelType));

  const statusCounts = ["Planned", "Created", "Posted", "Recording", "Editing"].map(s => ({ label: s, count: posts.filter(p => p.status === s).length })).filter(s => s.count > 0);

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", bg)}><Icon className={cn("h-5 w-5", color)} /></div>
          <div><h2 className="text-xl font-bold text-slate-900">{title}</h2><p className="text-sm text-slate-400">Channel management & content planner</p></div>
        </div>
        {!editing ? (
          <Button onClick={startEdit} variant="outline" className="gap-2"><Pencil className="h-4 w-4" /> Edit</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={() => saveChanMutation.mutate(form)} disabled={saveChanMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              {saveChanMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </Button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Channel Info */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-slate-700">Channel Info</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {editing ? (
                fields.map(f => (
                  <div key={f.key} className="space-y-1">
                    <Label>{f.label}</Label>
                    {f.type === "textarea" ? (
                      <Textarea rows={3} value={displayData[f.key] || ""} onChange={e => set(f.key, e.target.value)} />
                    ) : (
                      <Input type={f.type || "text"} value={displayData[f.key] || ""} onChange={e => set(f.key, f.type === "number" ? (parseFloat(e.target.value) || 0) : e.target.value)} />
                    )}
                  </div>
                ))
              ) : (
                fields.map(f => (
                  <div key={f.key} className="flex justify-between items-start text-sm border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <span className="text-slate-500 flex-shrink-0">{f.label}</span>
                    <span className="font-medium text-slate-800 text-right ml-2">
                      {f.type === "textarea"
                        ? (displayData[f.key] ? <span className="text-xs line-clamp-2">{displayData[f.key]}</span> : <span className="text-slate-300 italic text-xs">Not set</span>)
                        : (displayData[f.key] ? (typeof displayData[f.key] === "number" ? displayData[f.key].toLocaleString() : displayData[f.key]) : <span className="text-slate-300 italic">Not set</span>)
                      }
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Content Status Summary */}
          {statusCounts.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-slate-700">Content Status</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {statusCounts.map(s => (
                  <div key={s.label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{s.label}</span>
                    <Badge className="bg-slate-100 text-slate-700">{s.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Content Planner */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Content Planner <span className="text-slate-400 font-normal">({posts.length})</span></h3>
            <Button onClick={() => { setEditPost(null); setShowPostDialog(true); }} size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-1">
              <Plus className="h-3.5 w-3.5" /> Add Post
            </Button>
          </div>
          {posts.length === 0 ? (
            <Card className="border-dashed border-slate-300">
              <CardContent className="py-12 flex flex-col items-center gap-2 text-center">
                <p className="text-slate-400 text-sm">No content planned yet.</p>
                <Button onClick={() => { setEditPost(null); setShowPostDialog(true); }} variant="outline" size="sm" className="mt-1">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add First Post
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {posts.map(p => (
                <ContentPostCard key={p.id} post={p} onEdit={post => { setEditPost(post); setShowPostDialog(true); }} onDelete={post => deletePostMutation.mutate(post.id)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <ContentPostDialog
        open={showPostDialog}
        onClose={() => { setShowPostDialog(false); setEditPost(null); }}
        onSave={data => savePostMutation.mutateAsync(data)}
        post={editPost}
        channelType={channelType}
      />
    </div>
  );
}