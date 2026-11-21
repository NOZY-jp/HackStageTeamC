"use client";

import { useEffect } from "react";
import { photoContestResult } from "@/lib/blog-like/data/contest";
import { useStoryOptional } from "./story-provider";

/**
 * コンテスト結果の受賞者名。
 * 段階7（コンテスト名を知る）の後で結果ページを見つけたときだけ名前を出し、段階8を記録する（#76 順序7〜8）。
 * 名前はクライアント側のコードだけに持ち、HTML と RSC の復元データには含めない。
 */
const WINNER_NAME = photoContestResult.winnerName;

export function ContestResultReveal() {
  const story = useStoryOptional();
  const known = story?.state.flags.includes("s07-contest-entry") ?? false;
  const found = story?.state.flags.includes("s08-real-name") ?? false;
  const setFlag = story?.setFlag;

  useEffect(() => {
    if (known && !found && setFlag) setFlag("s08-real-name");
  }, [known, found, setFlag]);

  if (known) {
    return <span data-contest-winner>{WINNER_NAME}</span>;
  }
  // まだ名前にたどり着いていないあいだは、黒く塗って伏せる（作中のページとして自然な見た目にする）
  return (
    <span data-contest-winner className="contest-redacted" role="img" aria-label="伏せられた名前">
      <span aria-hidden="true">■■■■■</span>
    </span>
  );
}
