"use client";

import { useEffect } from "react";
import { useStoryOptional } from "./story-provider";

/**
 * コンテスト結果の受賞者名。
 * 段階7（コンテスト名を知る）の後で結果ページを見つけたときだけ名前を出し、段階8を記録する（#76 順序7〜8）。
 * 名前はこの部品の中だけに持ち、HTML と RSC の復元データには含めない。
 */
const WINNER_NAME = "服部 由比";

export function ContestResultReveal() {
  const story = useStoryOptional();
  const known = story?.state.flags.includes("s07-contest-entry") ?? false;
  const found = story?.state.flags.includes("s08-real-name") ?? false;
  const setFlag = story?.setFlag;

  useEffect(() => {
    if (known && !found && setFlag) setFlag("s08-real-name");
  }, [known, found, setFlag]);

  return <span data-contest-winner>{known ? WINNER_NAME : "（まだ見つけていない）"}</span>;
}
