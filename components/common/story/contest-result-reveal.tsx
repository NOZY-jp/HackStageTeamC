"use client";

import { useEffect } from "react";
import { photoContestResult } from "@/lib/blog-like/data/contest";
import { useStoryOptional } from "./story-provider";

/**
 * コンテスト結果の受賞者名（#76 順序7〜8）。
 * 段階7（コンテスト名を知る）の後で結果ページを見つけたときだけ名前を出し、段階8を記録する。
 * 名前はクライアント側のコードだけに持ち、HTML と RSC の復元データには含めない。
 * 主催者ページなので「まだ見つけていない」のような探索の文言は出さない（#222）。
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

  return known ? <p data-contest-winner>受賞者: {WINNER_NAME}</p> : null;
}
