import type { Metadata } from "next";
import { StoryBoard } from "./_components/story-board";

export const metadata: Metadata = {
  title: "シナリオ確認",
  // 開発・シナリオ確認用なので検索には載せない
  robots: { index: false, follow: false },
  description: "シナリオの進行を確認するための開発用画面です。",
};

/** シナリオの進行を1画面で確認する（開発・シナリオ確認用）。 */
export default function StoryPage() {
  return <StoryBoard />;
}
