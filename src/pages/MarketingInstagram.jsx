import React from "react";
import { Instagram } from "lucide-react";
import SocialChannelPage from "@/components/marketing/SocialChannelPage";

const FIELDS = [
  { key: "handle_or_url", label: "Account Handle" },
  { key: "followers", label: "Followers", type: "number" },
  { key: "engagement_rate", label: "Engagement Rate (%)", type: "number" },
  { key: "posting_frequency", label: "Posting Frequency" },
  { key: "content_strategy_notes", label: "Content Strategy Notes", type: "textarea" },
];

export default function MarketingInstagram() {
  return (
    <SocialChannelPage
      channelType="instagram"
      title="Instagram"
      icon={Instagram}
      color="text-pink-600"
      bg="bg-pink-50"
      fields={FIELDS}
    />
  );
}