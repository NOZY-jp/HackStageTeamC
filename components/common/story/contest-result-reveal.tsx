"use client";

import { useEffect, useRef } from "react";
import { photoContestResult } from "@/lib/blog-like/data/contest";
import { useStoryOptional } from "./story-provider";

/**
 * コンテスト結果の受賞者名（#76 順序7〜8）。
 * 本名を出してよいのは段階8（s08-real-name）以降だけ（#239）。
 * 段階7（コンテスト名を知る）の間は伏せた表記にし、ページを見たときに段階8を記録する。
 * 名前はクライアント側のコードだけに持ち、HTML と RSC の復元データには含めない。
 * 主催者ページなので「まだ見つけていない」のような探索の文言は出さない（#222）。
 */
const WINNER_NAME = photoContestResult.winnerName;

export function ContestResultReveal() {
  const story = useStoryOptional();
  const known = story?.state.flags.includes("s07-contest-entry") ?? false;
  const found = story?.state.flags.includes("s08-real-name") ?? false;
  // このページを見た時点で s08 を立てる。同じ閲覧では本名を出さず、
  // 次に開いたとき（s08 が既にある状態）から出す（#239）。
  const autoSet = useRef(false);
  const setFlag = story?.setFlag;

  useEffect(() => {
    if (known && !found && setFlag && !autoSet.current) {
      autoSet.current = true;
      setFlag("s08-real-name");
    }
  }, [known, found, setFlag]);

  // 本名は s08-real-name が成立してからだけ出す（#239）。
  // s07 は「コンテスト名を知る」段階なので、その間は伏せた表記にする。
  if (found && !autoSet.current) return <p data-contest-winner>受賞者: {WINNER_NAME}</p>;
  if (known) return <p data-contest-winner>受賞者: 該当アカウント（記事内で確認）</p>;
  return null;
}
