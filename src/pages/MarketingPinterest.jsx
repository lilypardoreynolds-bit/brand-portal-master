import React from "react";
import { FileImage } from "lucide-react";
import SocialChannelPage from "@/components/marketing/SocialChannelPage";

const FIELDS = [
  { key: "handle_or_url", label: "Account Name" },
  { key: "monthly_views", label: "Monthly Views", type: "number" },
  { key: "boards", label: "Boards" },
  { key: "content_strategy_notes", label: "Content Strategy Notes", type: "textarea" },
];

export default function MarketingPinterest() {
  return (
    <SocialChannelPage
      channelType="pinterest"
      title="Pinterest"
      icon={FileImage}
      color="text-rose-600"
      bg="bg-rose-50"
      fields={FIELDS}
    />
  );
}