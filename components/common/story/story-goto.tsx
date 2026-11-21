"use client";

import type { FlagId } from "@/lib/story";
import { useStoryOptional } from "./story-provider";

/**
 * 手がかりの場所へ進む操作。押したときにフラグを立ててから移動する。
 * 本番では開発用コンソールが無いので、この操作が段階を進める唯一の道になる（#119）。
 */
export function StoryGoto({
  href,
  flag,
  requires = [],
  children,
  className,
}: {
  href: string;
  flag?: FlagId;
  /** これが全部立っていないと出さない（順序を飛ばせない） */
  requires?: readonly FlagId[];
  children: React.ReactNode;
  className?: string;
}) {
  const story = useStoryOptional();
  if (!requires.every((required) => story?.state.flags.includes(required))) return null;
  return (
    <button
      type="button"
      className={className}
      data-story-goto={flag ?? "move"}
      onClick={() => {
        if (flag) story?.setFlag(flag);
        // 結果ページはサイト内のリンクとして HTML に残さない（手がかりの順序を守る）
        window.location.assign(href);
      }}
    >
      {children}
    </button>
  );
}
