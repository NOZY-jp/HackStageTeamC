import type { Metadata } from "next";
import { buildTitleFeeds } from "@/components/common/title/feeds";
import { TitleScreen } from "@/components/common/title/title-screen";
import { GAME_SUBTITLE, GAME_TITLE } from "@/components/common/title/title-text";

export const metadata: Metadata = {
  title: { absolute: GAME_TITLE },
  description: GAME_SUBTITLE,
};

/** ゲームの入口（タイトル画面） */
export default function RootPage() {
  return <TitleScreen feeds={buildTitleFeeds()} />;
}
