"use client";

import { photoContestResult } from "@/lib/blog-like/data/contest";
import { useStoryOptional } from "./story-provider";

/**
 * コンテスト結果の受賞者名（#76 順序7〜8）。
 * 本名を出してよいのは段階8（s08-real-name）以降だけ（#239）。
 * 段階7（コンテスト名を知る）の間は伏せた表記にし、「受賞者を確認する」で段階8を記録する。
 * 名前はクライアント側のコードだけに持ち、HTML と RSC の復元データには含めない。
 * 主催者ページなので「まだ見つけていない」のような探索の文言は出さない（#222）。
 */
const WINNER_NAME = photoContestResult.winnerName;

export function ContestResultReveal() {
  const story = useStoryOptional();
  const known = story?.state.flags.includes("s07-contest-entry") ?? false;
  const found = story?.state.flags.includes("s08-real-name") ?? false;

  // s08 が成立したら、同じマウントのまま氏名に切り替わる（#239）
  if (found) return <p data-contest-winner>受賞者: {WINNER_NAME}</p>;
  if (!known) return null;

  return (
    <p data-contest-winner>
      受賞者: 該当アカウント（記事内で確認）
      <button
        type="button"
        className="contest-award-confirm"
        onClick={() => story?.setFlag("s08-real-name")}
      >
        受賞者を確認する
      </button>
    </p>
  );
}
