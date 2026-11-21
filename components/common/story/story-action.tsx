"use client";

import type { FlagId } from "@/lib/story";
import { useStoryOptional } from "./story-provider";

/**
 * 物語の手がかりに「気づいた」ことを記録するボタン。
 * 画面を見ただけではフラグを立てず、プレイヤーが確かめた操作でだけ立てる（#119 の導線）。
 */
export function StoryAction({
  flag,
  children,
  doneLabel = "記録しました",
  className,
}: {
  flag: FlagId;
  children: React.ReactNode;
  doneLabel?: string;
  className?: string;
}) {
  const story = useStoryOptional();
  // 物語の外（部品の単体テストなど）では何も出さない
  if (!story) return null;
  const done = story.state.flags.includes(flag);
  return (
    <button
      type="button"
      className={className}
      disabled={done}
      onClick={() => story.setFlag(flag)}
      data-story-action={flag}
    >
      {done ? doneLabel : children}
    </button>
  );
}
