"use client";

import { useState } from "react";
import { HeartIcon } from "@/components/note-like/icons";

/**
 * スキ。保存先が無いので、押した状態はページを離れると戻る。
 * layout="column" は記事の横に浮かせる縦並び用。
 */
export function LikeButton({
  initialCount,
  layout = "row",
}: {
  initialCount: number;
  layout?: "row" | "column";
}) {
  const [liked, setLiked] = useState(false);
  const count = initialCount + (liked ? 1 : 0);

  return (
    <div className="note-like" data-layout={layout}>
      <button
        type="button"
        className="note-like-button"
        aria-pressed={liked}
        aria-label="スキ"
        onClick={() => setLiked((current) => !current)}
      >
        <HeartIcon filled={liked} />
      </button>
      <span className="note-like-total">{count}</span>
    </div>
  );
}
