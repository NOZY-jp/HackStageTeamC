"use client";

import { useState } from "react";

/** スキ。保存先が無いので、押した状態はページを離れると戻る。 */
export function LikeButton({ initialCount }: { initialCount: number }) {
  const [liked, setLiked] = useState(false);
  const count = initialCount + (liked ? 1 : 0);

  return (
    <button
      type="button"
      aria-pressed={liked}
      onClick={() => setLiked((current) => !current)}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
        liked
          ? "border-(--note-like) text-(--note-like)"
          : "border-(--note-line) text-(--note-text-muted) hover:border-(--note-like) hover:text-(--note-like)"
      }`}
    >
      <span aria-hidden="true" className="text-base leading-none">
        {liked ? "♥" : "♡"}
      </span>
      <span>スキ</span>
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
