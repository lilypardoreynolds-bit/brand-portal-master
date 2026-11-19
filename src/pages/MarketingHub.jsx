import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Instagram, Youtube, FileImage, Users, LayoutDashboard, TrendingUp, FileVideo, ArrowRight, CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isThisWeek } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import ContentApprovalDialog from "@/components/marketing/ContentApprovalDialog";
import ContentPostCard from "@/components/marketing/ContentPostCard";

const CHANNELS = [
  { name: "Website", page: "MarketingWebsite", icon: Globe, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", desc: "Website management & SEO" },
  { name: "Instagram", page: "MarketingInstagram", icon: Instagram, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200", desc: "Content planner & analytics" },
  { name: "TikTok", page: "MarketingTikTok", icon: FileVideo, color: "text-slate-800", bg: "bg-slate-100", border: "border-slate-200", desc: "Video planner & tracking" },
  { name: "YouTube", page: "MarketingYouTube", icon: Youtube, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", desc: "Channel & video management" },
  { name: "Pinterest", page: "MarketingPinterest", icon: FileImage, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", desc: "Pin planner & boards" },
  { name: "Content Creation", page: "MarketingContent", icon: LayoutDashboard, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200", desc: "Production pipeline" },
  { name: "Influencers & Affiliates", page: "MarketingInfluencers", icon: Users, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", desc: "Partnerships & campaigns" },
];

const STATUS_ORDER = ["Idea", "Recording", "Editing", "Ready to Post", "Published"];

export default function MarketingHub() {
  const [approvalPost, setApprovalPost] = useState(null);
  const qc = useQueryClient();

  const { data: posts = [] } = useQuery({ queryKey: ["content_posts_all"], queryFn: () => base44.entities.ContentPost.list(), initialData: [] });
  const { data: productions = [] } = useQuery({ queryKey: ["content_productions_all"], queryFn: () => base44.entities.ContentProduction.list(), initialData: [] });
  const { data: influencers = [] } = useQuery({ queryKey: ["influencers_all"], queryFn: () => base44.entities.Influencer.list(), initialData: [] });

  const approvalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ContentPost.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content_posts_all"] }),
  });

  const pendingPosts = posts.filter(p => (p.approval_status || "pending") === "pending");
  const approvedCount = posts.filter(p => p.approval_status === "approved").length;
  const rejectedCount = posts.filter(p => p.approval_status === "rejected").length;

  const totalPlanned = posts.filter(p => p.status === "Planned").length;
  const postedThisWeek = posts.filter(p => p.status === "Posted" && p.posting_date && isThisWeek(new Date(p.posting_date))).length;
  const activeCampaigns = influencers.filter(i => i.partnership_status === "Active").length;
  const totalProduction = productions.length;

  const productionByStatus = STATUS_ORDER.map(s => ({ name: s.replace(" to ", "\nto "), count: productions.filter(p => p.status === s).length }));

  const postsByChannel = ["instagram", "tiktok", "youtube", "pinterest"].map(c => ({
    name: c.charAt(0).toUpperCase() + c.slice(1),
    posts: posts.filter(p => p.channel_type === c).length,
  }));

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Marketing Hub</h2>
        <p className="text-sm text-slate-500 mt-0.5">Manage all marketing channels, content, and partnerships in one place</p>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Planned Posts", value: totalPlanned, icon: LayoutDashboard, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Posted This Week", value: postedThisWeek, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Active Campaigns", value: activeCampaigns, icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Content in Production", value: totalProduction, icon: FileVideo, color: "text-amber-600", bg: "bg-amber-50" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-slate-200">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", s.bg)}>
                  <Icon className={cn("h-5 w-5", s.color)} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-slate-700 mb-4">Posts by Channel</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={postsByChannel} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="posts" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-slate-700 mb-4">Content Production Pipeline</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={productionByStatus} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Channel Grid */}
      <div>
        <h3 className="text-base font-semibold text-slate-800 mb-4">Marketing Channels</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {CHANNELS.map(ch => {
            const Icon = ch.icon;
            return (
              <Link key={ch.page} to={createPageUrl(ch.page)}>
                <Card className={cn("border hover:shadow-md transition-all duration-200 cursor-pointer group", ch.border)}>
                  <CardContent className="p-5">
                    <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center mb-3", ch.bg)}>
                      <Icon className={cn("h-5 w-5", ch.color)} />
                    </div>
                    <p className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">{ch.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{ch.desc}</p>
                    <div className="flex items-center gap-1 mt-3 text-xs text-slate-400 group-hover:text-indigo-500 transition-colors">
                      <span>Open</span><ArrowRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content Approval */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-800">Content Planner Approval</h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-amber-600"><Clock className="h-3.5 w-3.5" /> {pendingPosts.length} Pending</span>
            <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> {approvedCount} Approved</span>
            <span className="flex items-center gap-1 text-red-500"><XCircle className="h-3.5 w-3.5" /> {rejectedCount} Rejected</span>
          </div>
        </div>
        {pendingPosts.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="py-10 flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              <p className="text-sm text-slate-500">All content has been reviewed!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingPosts.slice(0, 6).map(post => (
              <ContentPostCard
                key={post.id}
                post={post}
                onEdit={() => {}}
                onDelete={() => {}}
                onApprove={(p) => setApprovalPost(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Influencers */}
      {influencers.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800">Recent Influencer Partnerships</h3>
            <Link to={createPageUrl("MarketingInfluencers")} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {influencers.slice(0, 3).map(inf => (
              <Card key={inf.id} className="border-slate-200">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {inf.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{inf.name}</p>
                    <p className="text-xs text-slate-400">{inf.platform} · {inf.followers?.toLocaleString()} followers</p>
                  </div>
                  <Badge className={inf.partnership_status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                    {inf.partnership_status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      <ContentApprovalDialog
        open={!!approvalPost}
        post={approvalPost}
        onClose={() => setApprovalPost(null)}
        onSave={(id, data) => approvalMutation.mutateAsync({ id, data })}
      />
    </div>
  );
}