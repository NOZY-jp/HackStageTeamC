"use client";

import Link from "next/link";
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
  const clearPendingBack = useRef<(() => void) | undefined>(undefined);

  useEffect(() => () => clearPendingBack.current?.(), []);

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (clearPendingBack.current) {
      event.preventDefault();
      return;
    }

    const { navigation } = window as Window & { navigation?: BrowserNavigation };
    const current = navigation?.currentEntry;
    const previous =
      current && current.index >= 1 ? navigation?.entries()[current.index - 1] : undefined;
    if (window.history.length <= 1) return;
    if (navigation) {
      // 戻り先の origin を確認できないときは戻らない（外部の履歴へ抜けないようにする）。
      // entries() は同一オリジンの履歴だけを返すはずだが、URL が隠れる（null）ことがあるので、
      // その場合は判断材料が無いものとして既定のリンクへ進む。
      if (!previous || previous.url === null || !isSameOrigin(previous.url)) return;
    } else if (!canGoBackWithinDocument()) {
      return;
    }

    event.preventDefault();
    const url = window.location.href;
    const fallback = () => {
      if (window.location.href === url) router.replace(fallbackHref);
    };

    if (navigation && previous && !previous.sameDocument) {
      // クロスドキュメントの遷移では Promise が完了しない。応答待ちをタイマーで横取りしない。
      const { committed, finished } = navigation.traverseTo(previous.key);
      void Promise.all([committed, finished]).catch(fallback);
      return;
    }

    let timer: number | undefined;
    const complete = () => {
      if (clearPendingBack.current !== complete) return;
      window.clearTimeout(timer);
      window.removeEventListener("popstate", complete);
      clearPendingBack.current = undefined;
    };
    clearPendingBack.current = complete;
    window.addEventListener("popstate", complete, { once: true });
    const fail = () => {
      if (clearPendingBack.current !== complete) return;
      complete();
      fallback();
    };

    if (navigation && previous) {
      const { committed, finished } = navigation.traverseTo(previous.key);
      void committed.then(complete, fail);
      void finished.catch(fail);
    } else {
      timer = window.setTimeout(fail, 300);
      window.history.back();
    }
  };

  return (
    <Link href={fallbackHref} className="tw-back" aria-label="戻る" onClick={onClick}>
      <BackIcon />
    </Link>
  );
}
