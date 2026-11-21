"use client";

import { useEffect } from "react";

/**
 * アプリ内で戻れる回数（#249）。
 * タブごとの sessionStorage に「入ったときの history.length」と「戻った回数」を持ち、
 * 差分だけをアプリ内の履歴とみなす。pathname の変化では数えない。
 */
export const TWITTER_BASE_KEY = "twixer:app-base-history:v1";
export const TWITTER_BACK_KEY = "twixer:back-count:v1";

const readNumber = (key: string): number | undefined => {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (raw === null) return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
  } catch {
    return undefined;
  }
};

const writeNumber = (key: string, value: number) => {
  try {
    window.sessionStorage.setItem(key, String(Math.max(0, Math.floor(value))));
  } catch {
    // 覚えられなくても fallback は動く
  }
};

/** アプリに入った時点の history.length を記録する（既にあれば触らない） */
export function ensureAppBase() {
  if (readNumber(TWITTER_BASE_KEY) === undefined) {
    writeNumber(TWITTER_BASE_KEY, window.history.length);
    writeNumber(TWITTER_BACK_KEY, 0);
  }
}

/** アプリ内で戻れる残り回数（負にならない） */
export function internalBackRemaining(): number {
  const base = readNumber(TWITTER_BASE_KEY);
  if (base === undefined) return 0;
  const used = readNumber(TWITTER_BACK_KEY) ?? 0;
  return Math.max(0, window.history.length - base - used);
}

/** アプリ内に戻る先があれば1回戻り、使った回数を記録する */
export function goBackInsideApp(): boolean {
  const base = readNumber(TWITTER_BASE_KEY);
  if (base === undefined) return false;
  const used = readNumber(TWITTER_BACK_KEY) ?? 0;
  if (window.history.length - base - used <= 0) return false;
  writeNumber(TWITTER_BACK_KEY, used + 1);
  window.history.back();
  return true;
}

/** 最初のページを開いたときだけ基準を記録する。pathname の変化では何もしない。 */
export function TwitterHistoryTracker() {
  useEffect(() => {
    ensureAppBase();
  }, []);
  return null;
}
