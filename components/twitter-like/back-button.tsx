"use client";

import type { MouseEvent } from "react";
import { goBackInsideApp } from "./history-tracker";
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
 * 戻るボタン（#249）。アプリ内に入ってからの履歴が残っていれば1つ戻り、
 * 無ければ fallback へ。外部から入っただけでは戻らない。
 */
export function BackButton({ fallbackHref }: { fallbackHref: string }) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (goBackInsideApp()) {
      event.preventDefault();
      return;
    }
    if (isSameOriginReferrer(window.document.referrer, window.location.origin)) {
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
