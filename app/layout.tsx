import type { Metadata } from "next";
import { Suspense } from "react";
import { BrowserChrome } from "@/components/common/browser/browser-chrome";
import { StoryPage, StoryProvider } from "@/components/common/story/story-provider";
import { StoryStage } from "@/components/common/story/story-stage";
import { StoryStart } from "@/components/common/story/story-start";
import { SITE_URL } from "@/lib/seo/site";
import { googleVerification } from "@/lib/seo/verification";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "HackStage",
    template: "%s | HackStage",
  },
  description: "チーム開発のためのDiscord風ワークスペース",
  verification: googleVerification(),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full">
      <body className="h-full">
        {/* シナリオの進行状態は全プラットフォームで共有する */}
        <StoryProvider>
          {/* 作中ブラウザの上部ツールバー */}
          <Suspense fallback={null}>
            <BrowserChrome />
          </Suspense>
          {/* 場面を流しているあいだは、後ろの画面を inert にする */}
          <StoryPage>{children}</StoryPage>
          {/* 台本をどの画面の上にも出す（usePathname を使うので Suspense で包む） */}
          <Suspense fallback={null}>
            <StoryStart />
            <StoryStage />
          </Suspense>
        </StoryProvider>
      </body>
    </html>
  );
}
