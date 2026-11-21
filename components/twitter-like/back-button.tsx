"use client";

import type { MouseEvent } from "react";
import { BackIcon } from "./icons";

/**
 * 戻るボタン（#249）。同じオリジンの履歴があれば1つ戻り、無ければ fallback へ。
 * アプリ外（別オリジン）から来た場合は戻らず、fallback へ通常遷移する。
 */
export function BackButton({ fallbackHref }: { fallbackHref: string }) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const origin = window.location.origin;
    const sameOrigin = window.document.referrer.startsWith(origin);
    if (sameOrigin && window.history.length > 1) {
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
