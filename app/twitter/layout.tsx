import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandIcon } from "@/components/twitter/icons";
import { TwitterNav } from "@/components/twitter/nav";
import { RightSidebar } from "@/components/twitter/right-sidebar";

export const metadata: Metadata = {
  title: { default: "HackStage タイムライン", template: "%s | HackStage" },
  description: "HackStage の Twitter 風タイムライン（ダミーデータ）",
};

export default function TwitterLayout({ children }: { children: ReactNode }) {
  return (
    <div className="tw-shell">
      <header className="tw-brand-header">
        <Link href="/twitter" className="tw-brand" aria-label="HackStage タイムラインへ">
          <BrandIcon />
          <span className="tw-brand-name">HackStage</span>
        </Link>
        <Link href="/dm" className="tw-brand-switch">
          Discord風UIへ
        </Link>
      </header>
      <div className="tw-body">
        <TwitterNav />
        <main className="tw-main">{children}</main>
        <RightSidebar />
      </div>
    </div>
  );
}
