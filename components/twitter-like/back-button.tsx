"use client";

import { useRouter } from "next/navigation";
import { type MouseEvent, useEffect, useRef } from "react";
import { canGoBackWithinDocument } from "./document-history";
import { BackIcon } from "./icons";

type HistoryEntry = {
  key: string;
  sameDocument: boolean;
  url: string | null;
};

type BrowserNavigation = {
  currentEntry: { index: number } | null;
  entries(): HistoryEntry[];
  traverseTo(key: string): { committed: Promise<unknown>; finished: Promise<unknown> };
};

function isSameOrigin(url: string | null): boolean {
  if (!url) return false;
  try {
    return new URL(url).origin === window.location.origin;
  } catch {
    return false;
  }
}

export function BackButton({ fallbackHref }: { fallbackHref: string }) {
  const router = useRouter();
  const pendingBack = useRef<number | undefined>(undefined);

  const clearPendingBack = useRef<(() => void) | undefined>(undefined);

  useEffect(() => () => clearPendingBack.current?.(), []);

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (pendingBack.current !== undefined) {
      event.preventDefault();
      return;
    }

    const { navigation } = window as Window & { navigation?: BrowserNavigation };
    const current = navigation?.currentEntry;
    const previous =
      current && current.index >= 1 ? navigation?.entries()[current.index - 1] : undefined;
    if (window.history.length <= 1) return;
    if (navigation) {
      if (!previous || !isSameOrigin(previous.url)) return;
      // A document referrer does not change during SPA moves.
      if (!previous.sameDocument && !isSameOrigin(document.referrer)) return;
    } else if (!canGoBackWithinDocument()) {
      return;
    }

    event.preventDefault();
    const url = window.location.href;
    const complete = () => {
      if (clearPendingBack.current !== complete) return;
      window.clearTimeout(pendingBack.current);
      pendingBack.current = undefined;
      window.removeEventListener("popstate", complete);
      clearPendingBack.current = undefined;
    };
    clearPendingBack.current = complete;
    window.addEventListener("popstate", complete, { once: true });
    pendingBack.current = window.setTimeout(() => {
      complete();
      if (window.location.href === url) router.replace(fallbackHref);
    }, 300);

    if (navigation && previous) {
      const { committed, finished } = navigation.traverseTo(previous.key);
      void Promise.all([committed, finished]).then(
        () => {
          if (window.location.href !== url) complete();
        },
        () => {
          // The timeout also covers a failed traversal.
        },
      );
    } else {
      window.history.back();
    }
  };

  return (
    <a href={fallbackHref} className="tw-back" aria-label="戻る" onClick={onClick}>
      <BackIcon />
    </a>
  );
}
