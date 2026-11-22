"use client";

import { useEffect } from "react";
import { photoContestResult } from "@/lib/blog-like/data/contest";
import { useStoryOptional } from "./story-provider";

/**
 * コンテスト結果の受賞者名（#76 順序7〜8）。
 * 段階7（受賞記事を開いてコンテスト名を知る）の後でこのページを見たら、ふつうの結果ページと同じく名前を出し、
 * そのまま段階8を記録する。「受賞者を確認する」のような、作中のページに無いボタンは置かない（#222）。
 * 段階7の前は受賞者の行ごと出さない（伏せ字や探索の文言も出さない）。
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

  if (!known) return null;
  return <p data-contest-winner>受賞者　{WINNER_NAME}</p>;
}
