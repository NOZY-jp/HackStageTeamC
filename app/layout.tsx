import type { Metadata } from "next";
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
      <body className="h-full">{children}</body>
    </html>
  );
}
