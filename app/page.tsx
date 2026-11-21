import type { Metadata } from "next";
import { Shippori_Mincho } from "next/font/google";
import { buildTitleFeeds } from "@/components/common/title/feeds";
import { TitleScreen } from "@/components/common/title/title-screen";
import { GAME_SUBTITLE, GAME_TITLE } from "@/components/common/title/title-text";

export const metadata: Metadata = {
  title: { absolute: GAME_TITLE },
  description: GAME_SUBTITLE,
};

/** タイトル・サブタイトル・ボタンの明朝体（どの端末でも同じ雰囲気で出す） */
const titleFont = Shippori_Mincho({
  weight: ["500", "700"],
  subsets: ["latin"],
  preload: false,
  display: "swap",
  variable: "--tt-font-title",
});

/** ゲームの入口（タイトル画面） */
export default function RootPage() {
  return (
    <div className={titleFont.variable}>
      <TitleScreen feeds={buildTitleFeeds()} />
    </div>
  );
}
