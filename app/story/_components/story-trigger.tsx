"use client";

import { useEffect } from "react";
import { applyTrigger, loadProgress, saveProgress, triggers } from "@/lib/story";

/**
 * きっかけ部品（#81）。各画面に置くと、開いたときにフラグが立つ。
 * 例: マイリスト画面に `<StoryTrigger triggerId="open-mylist" />` を置く。
 * 表示は持たない（children を渡せばそのまま描く）。
 */
export function StoryTrigger({
  triggerId,
  children,
}: {
  triggerId: string;
  children?: React.ReactNode;
}) {
  useEffect(() => {
    const trigger = triggers.find((candidate) => candidate.id === triggerId);
    if (!trigger) {
      return;
    }
    const current = loadProgress();
    const next = applyTrigger(current, trigger);
    // すでに立っているなら保存しない（無駄な通知を出さない）
    if (next.flags.length !== current.flags.length) {
      saveProgress(next);
    }
  }, [triggerId]);

  return children ?? null;
}
