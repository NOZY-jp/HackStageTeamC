import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TwitterNav } from "@/components/twitter-like/nav";

export const metadata: Metadata = {
  title: { default: "HackStage タイムライン", template: "%s | HackStage" },
  description: "HackStage の Twitter 風タイムライン（ダミーデータ）",
};

export default function TwitterLayout({ children }: { children: ReactNode }) {
  return (
    <div className="tw-shell">
      <TwitterNav />
      <div className="tw-body">{children}</div>
    </div>
  );
}
