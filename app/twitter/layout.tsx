import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TwitterNav } from "@/components/twitter-like/nav";
import { HAL_HANDLE } from "@/lib/discord-like/data/names";
import { getUserByHandle } from "@/lib/twitter-like";

export const metadata: Metadata = {
  title: { default: "Twixer", template: "%s | Twixer" },
  description: "Twixerで話題のポストやフォロー中のアカウントの近況をチェック。",
};

export default function TwitterLayout({ children }: { children: ReactNode }) {
  return (
    <div className="tw-shell">
      <TwitterNav me={getUserByHandle(HAL_HANDLE)} />
      <div className="tw-body">{children}</div>
    </div>
  );
}
