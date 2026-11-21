"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** アプリ内で積んだ履歴の数（#249）。戻るで外部へ出ないための目安。 */
export const TWITTER_HISTORY_KEY = "twixer:internal-history-count:v1";

export function readInternalHistoryCount(): number {
  try {
    const value = Number(window.sessionStorage.getItem(TWITTER_HISTORY_KEY) ?? "0");
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

export function writeInternalHistoryCount(count: number) {
  try {
    window.sessionStorage.setItem(TWITTER_HISTORY_KEY, String(Math.max(0, count)));
  } catch {
    // 覚えられなくても、戻るの fallback は動く
  }
}

/**
 * Twixer 内の画面遷移を数える。初回表示（直リンク・外部流入）は数えず、
 * アプリ内で1回でも遷移したら 1 以上になる。
 */
export function TwitterHistoryTracker() {
  const pathname = usePathname();
  const previous = useRef<string | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      previous.current = pathname;
      return;
    }
    if (previous.current === pathname) return;
    previous.current = pathname;
    writeInternalHistoryCount(readInternalHistoryCount() + 1);
  }, [pathname]);

  return null;
}
