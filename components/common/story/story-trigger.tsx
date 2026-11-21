"use client";

import { useEffect } from "react";
import type { FlagId } from "@/lib/story";
import { useOptionalStory } from "./story-provider";

/**
 * 置いた画面を開いたら、フラグを立てる。見た目は何も出さない。
 * delayMs を指定すると、ready になってから指定ミリ秒後にフラグを立てる（アンマウント時はキャンセル）。
 * StoryProvider の外（個別ページの単体テストなど）では何もせず安全に抜ける。
 * 例: マイリストのページに <StoryTrigger flag="s06-old-profile-link" /> を置く。
 * どの段階のフラグをどこに置くかは lib/story/steps.ts の places を見る。
 */
export function StoryTrigger({ flag, delayMs }: { flag: FlagId; delayMs?: number }) {
  const story = useOptionalStory();
  const ready = story?.ready ?? false;
  const setFlag = story?.setFlag;

  useEffect(() => {
    if (!ready || !setFlag) {
      return;
    }
    if (delayMs !== undefined && delayMs > 0) {
      const timer = window.setTimeout(() => {
        setFlag(flag);
      }, delayMs);
      return () => window.clearTimeout(timer);
    }
    setFlag(flag);
  }, [flag, delayMs, ready, setFlag]);

  return null;
}
