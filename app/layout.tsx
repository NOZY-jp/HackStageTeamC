import type { Metadata } from "next";
import { StoryProvider } from "@/components/common/story/story-provider";
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
        <StoryProvider>{children}</StoryProvider>
      </body>
    </html>
  );
}
