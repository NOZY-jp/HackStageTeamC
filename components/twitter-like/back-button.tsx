"use client";

import type { MouseEvent } from "react";
import { readInternalHistoryCount, writeInternalHistoryCount } from "./history-tracker";
import { BackIcon } from "./icons";

/** referrer が同じオリジンか。空・壊れた値は外部として扱う（#249 QA）。 */
export function isSameOriginReferrer(referrer: string, origin: string): boolean {
  if (!referrer) return false;
  try {
    return new URL(referrer).origin === origin;
  } catch {
    return false;
  }
}

/**
 * 戻るボタン（#249）。アプリ内で積んだ履歴があれば1つ戻り、無ければ fallback へ。
 * 外部から入っただけでは戻らない（アプリ内遷移が1回でもあれば戻る）。
 */
export function BackButton({ fallbackHref }: { fallbackHref: string }) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const internal = readInternalHistoryCount();
    if (internal > 0) {
      event.preventDefault();
      writeInternalHistoryCount(internal - 1);
      window.history.back();
      return;
    }
    if (
      isSameOriginReferrer(window.document.referrer, window.location.origin) &&
      window.history.length > 1
    ) {
      event.preventDefault();
      window.history.back();
    }
  };

  return (
    <a href={fallbackHref} className="tw-back" aria-label="戻る" onClick={onClick}>
      <BackIcon />
    </a>
  );
}
