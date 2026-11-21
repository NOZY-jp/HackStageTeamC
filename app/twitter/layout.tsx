import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TwitterHistoryTracker } from "@/components/twitter-like/history-tracker";
import { TwitterNav } from "@/components/twitter-like/nav";

export const metadata: Metadata = {
  title: { default: "Twixer", template: "%s | Twixer" },
  description: "Twixerで話題のポストやフォロー中のアカウントの近況をチェック。",
};

export default function TwitterLayout({ children }: { children: ReactNode }) {
  return (
    <div className="tw-shell">
      <TwitterHistoryTracker />
      <TwitterNav />
      <div className="tw-body">{children}</div>
    </div>
  );
}
