"use client";

import { useRouter } from "next/navigation";
import { type MouseEvent, useEffect, useRef } from "react";
import { BackIcon } from "./icons";

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

    // This checks the actual previous entry, including after browser Back or Forward.
    // A document's referrer and the total history length cannot identify that entry.
    const { navigation } = window as Window & { navigation?: { canGoBack: boolean } };
    if (window.history.length <= 1 || !navigation?.canGoBack) return;

    event.preventDefault();
    const url = window.location.href;
    pendingBack.current = window.setTimeout(() => {
      pendingBack.current = undefined;
      if (window.location.href === url) router.replace(fallbackHref);
    }, 300);
    window.history.back();
  };

  return (
    <a href={fallbackHref} className="tw-back" aria-label="戻る" onClick={onClick}>
      <BackIcon />
    </a>
  );
}
