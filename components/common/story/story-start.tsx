"use client";

import { useEffect } from "react";
import { useStoryOptional } from "./story-provider";

/** アプリを開いた時点を「ゲーム開始」にする（開発用コンソールに依存しない入口・#119） */
export function StoryStart() {
  const story = useStoryOptional();
  const ready = story?.ready ?? false;
  const started = story?.state.flags.includes("started") ?? false;
  const setFlag = story?.setFlag;
  useEffect(() => {
    if (ready && !started && setFlag) setFlag("started");
  }, [ready, started, setFlag]);
  return null;
}
