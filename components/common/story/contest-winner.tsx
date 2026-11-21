"use client";

import { useStoryOptional } from "./story-provider";

/**
 * コンテスト結果の受賞者名。プレイヤーが「受賞者を確認する」（s07）まで伏せる。
 * #76 の順序7は「結果ページで受賞者を見た」なので、見る前の HTML に本名を出さない。
 */
export function ContestWinnerName({ name }: { name: string }) {
  const story = useStoryOptional();
  const revealed = story?.state.flags.includes("s07-contest-entry") ?? false;
  return <span data-contest-winner>{revealed ? name : "（確認していない）"}</span>;
}
