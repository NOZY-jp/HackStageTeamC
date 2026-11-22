"use client";

import { useRouter } from "next/navigation";
import { type MouseEvent, useEffect, useRef } from "react";
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

  useEffect(() => () => window.clearTimeout(pendingBack.current), []);

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    if (pendingBack.current !== undefined) {
      event.preventDefault();
      return;
    }

    const { navigation } = window as Window & { navigation?: BrowserNavigation };
    const current = navigation?.currentEntry;
    if (!navigation || !current || current.index < 1 || window.history.length <= 1) return;
    const previous = navigation.entries()[current.index - 1];
    if (!previous || !isSameOrigin(previous.url)) return;
    // An external document referrer does not change during same-document moves.
    if (!previous.sameDocument && !isSameOrigin(document.referrer)) return;

    event.preventDefault();
    const url = window.location.href;
    pendingBack.current = window.setTimeout(() => {
      pendingBack.current = undefined;
      if (window.location.href === url) router.replace(fallbackHref);
    }, 300);

    // Target the verified entry rather than traversing an unchecked offset.
    const { committed, finished } = navigation.traverseTo(previous.key);
    void Promise.all([committed, finished]).catch(() => {
      // A failed traversal is handled by the same timeout as a stalled one.
    });
  };

  return (
    <a href={fallbackHref} className="tw-back" aria-label="戻る" onClick={onClick}>
      <BackIcon />
    </a>
  );
}
