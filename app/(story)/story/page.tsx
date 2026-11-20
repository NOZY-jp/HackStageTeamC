import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoryConsole } from "@/app/(story)/_components/story-console";
import { storyConsoleEnabled } from "@/app/(story)/_components/story-gate";

export const metadata: Metadata = {
  title: "進行チェック（開発用）",
  // 謎解きの答えの道筋が全部見えるので、検索に載せない
  robots: { index: false, follow: false },
};

/** 進行チェックの画面（開発・シナリオ担当向け。ゲームの画面ではない） */
export default function StoryPage() {
  if (!storyConsoleEnabled()) {
    notFound();
  }
  return <StoryConsole />;
}
