import React from "react";
import { Youtube } from "lucide-react";
import SocialChannelPage from "@/components/marketing/SocialChannelPage";

const FIELDS = [
  { key: "handle_or_url", label: "Channel Name" },
  { key: "subscribers", label: "Subscribers", type: "number" },
  { key: "video_frequency", label: "Video Frequency" },
  { key: "content_strategy_notes", label: "Content Strategy Notes", type: "textarea" },
];

export default function MarketingYouTube() {
  return (
    <SocialChannelPage
      channelType="youtube"
      title="YouTube"
      icon={Youtube}
      color="text-red-600"
      bg="bg-red-50"
      fields={FIELDS}
    />
  );
}