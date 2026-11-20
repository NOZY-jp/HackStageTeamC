"use client";

import { useEffect } from "react";
import type { FlagId } from "@/lib/story";
import { useStory } from "./story-provider";

/**
 * 置いた画面を開いたら、フラグを立てる。見た目は何も出さない。
 * 例: マイリストのページに <StoryTrigger flag="s06-old-profile-link" /> を置く。
 * どの段階のフラグをどこに置くかは lib/story/steps.ts の places を見る。
 */
export function StoryTrigger({ flag }: { flag: FlagId }) {
  const { setFlag, ready } = useStory();

  useEffect(() => {
    if (ready) {
      setFlag(flag);
    }
  }, [flag, ready, setFlag]);

  return null;
}
