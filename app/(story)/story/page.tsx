import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoryConsole } from "@/app/(story)/_components/story-console";

export const metadata: Metadata = {
  title: "進行チェック（開発用）",
  // 謎解きの答えの道筋が全部見えるので、検索に載せない
  robots: { index: false, follow: false },
};

/**
 * 進行チェックの画面（開発・シナリオ担当向け。ゲームの画面ではない）。
 * 謎解きの道筋が全部見えるので、本番（Google にインデックスさせるサイト）では開けない。
 * 本番で確認したいときは環境変数 NEXT_PUBLIC_STORY_CONSOLE=1 を付ける。
 */
export default function StoryPage() {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_STORY_CONSOLE !== "1") {
    notFound();
  }
  return <StoryConsole />;
}
