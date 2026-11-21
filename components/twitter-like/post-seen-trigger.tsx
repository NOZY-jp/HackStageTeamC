"use client";

import { useEffect, useRef } from "react";
import { useOptionalStory } from "@/components/common/story/story-provider";
import type { FlagId } from "@/lib/story";

/**
 * 囲った投稿が画面内に半分以上見えたときに、指定した物語フラグを立てる。
 * StoryProvider の外（単体テストなど）や IntersectionObserver 未対応環境では安全に何もしない。
 */
export function PostSeenTrigger({ flag, children }: { flag: FlagId; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const story = useOptionalStory();
  const ready = story?.ready ?? false;
  const setFlag = story?.setFlag;

  useEffect(() => {
    const element = ref.current;
    if (!ready || !setFlag || !element || typeof IntersectionObserver === "undefined") {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          setFlag(flag);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [flag, ready, setFlag]);

  return <div ref={ref}>{children}</div>;
}
