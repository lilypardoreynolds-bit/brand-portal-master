import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Megaphone, Users, FileImage, TrendingUp, ArrowRight } from "lucide-react";
import { isThisWeek } from "date-fns";

export default function MarketingActivity({ posts = [], channels = [], influencers = [] }) {
  const activeCampaigns = channels.filter(c => c.is_active).length;
  const contentThisWeek = posts.filter(p => p.scheduled_date && isThisWeek(new Date(p.scheduled_date))).length;
  const activeInfluencers = influencers.filter(i => i.status === "Active" || i.partnership_status === "Active").length;

  const stats = [
    { icon: Megaphone, label: "Active Campaigns", value: activeCampaigns, color: "bg-indigo-50 text-indigo-600" },
    { icon: FileImage, label: "Content This Week", value: contentThisWeek, color: "bg-violet-50 text-violet-600" },
    { icon: Users, label: "Influencer Partners", value: activeInfluencers, color: "bg-rose-50 text-rose-600" },
    { icon: TrendingUp, label: "Active Channels", value: channels.length, color: "bg-emerald-50 text-emerald-600" },
  ];

  const recentPosts = posts.slice(0, 4);

  return (
    <Card className="border-slate-200 shadow-sm h-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Marketing Activity</CardTitle>
        <Link to={createPageUrl("MarketingHub")} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className={`rounded-xl p-3 flex items-center gap-2.5 ${color.split(" ")[0]}`}>
              <div className={`h-8 w-8 rounded-lg bg-white/70 flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-4 w-4 ${color.split(" ")[1]}`} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-medium">{label}</p>
                <p className={`text-lg font-bold ${color.split(" ")[1]}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {recentPosts.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Recent Content</p>
            <div className="space-y-2">
              {recentPosts.map(post => (
                <div key={post.id} className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium shrink-0">
                      {post.platform || post.channel || "Post"}
                    </span>
                    <span className="text-xs text-slate-700 truncate">{post.title || post.content_title || "Untitled"}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 ml-2 shrink-0">
                    {post.status || post.content_status || ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-3">No content scheduled yet</p>
        )}
      </CardContent>
    </Card>
  );
}