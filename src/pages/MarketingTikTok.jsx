import React from "react";
import { FileVideo } from "lucide-react";
import SocialChannelPage from "@/components/marketing/SocialChannelPage";

const FIELDS = [
  { key: "handle_or_url", label: "Account Handle" },
  { key: "followers", label: "Followers", type: "number" },
  { key: "avg_views", label: "Average Views", type: "number" },
  { key: "posting_frequency", label: "Posting Frequency" },
  { key: "content_strategy_notes", label: "Content Strategy Notes", type: "textarea" },
];

export default function MarketingTikTok() {
  return (
    <SocialChannelPage
      channelType="tiktok"
      title="TikTok"
      icon={FileVideo}
      color="text-slate-800"
      bg="bg-slate-100"
      fields={FIELDS}
    />
  );
}