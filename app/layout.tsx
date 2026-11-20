import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo/site";
import "./globals.css";

/**
 * Google Search Console の所有確認タグ。トークンは環境変数で渡す（repo には書かない）。
 * 未設定なら verification を出さない（ビルド時に評価される）。
 */
export function googleVerification(
  token: string | undefined = process.env.GOOGLE_SITE_VERIFICATION,
): Metadata["verification"] {
  return token ? { google: token } : undefined;
}

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
