import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TwitterNav } from "@/components/twitter-like/nav";

export const metadata: Metadata = {
  title: { default: "Twixer", template: "%s | Twixer" },
  description: "HackStage 作中の SNS「Twixer」タイムライン（ダミーデータ）",
};

export default function TwitterLayout({ children }: { children: ReactNode }) {
  return (
    <div className="tw-shell">
      <TwitterNav />
      <div className="tw-body">{children}</div>
    </div>
  );
}
