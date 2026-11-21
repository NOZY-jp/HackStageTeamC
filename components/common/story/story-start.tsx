"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useStoryOptional } from "./story-provider";

/**
 * アプリを開いた時点を「ゲーム開始」にする（開発用コンソールに依存しない入口・#119）。
 * タイトル画面（/）では始めない（「はじめる」を押したときに始める）。各画面を直接開いたときは、これまでどおり始める
 */
export function StoryStart() {
  const pathname = usePathname();
  const onTitle = pathname === "/";
  const story = useStoryOptional();
  const ready = story?.ready ?? false;
  const started = story?.state.flags.includes("started") ?? false;
  const setFlag = story?.setFlag;
  useEffect(() => {
    if (ready && !started && setFlag && !onTitle) setFlag("started");
  }, [ready, started, setFlag, onTitle]);
  return null;
}
