"use client";

import { useEffect } from "react";

const positionKey = "__hackStageDocumentHistory";
let documentId: number[] | undefined;

function readDepth(): number {
  const position = window.history.state?.[positionKey];
  if (!documentId || !Array.isArray(position?.id)) return 0;
  if (position.id.length !== documentId.length) return 0;
  if (!documentId.every((part, index) => part === position.id[index])) return 0;
  return Number.isSafeInteger(position.depth) && position.depth > 0 ? position.depth : 0;
}

export function canGoBackWithinDocument(): boolean {
  return window.history.length > 1 && readDepth() > 0;
}

/** Track entries created in this document. History length alone can include external pages. */
export function trackDocumentHistory(): () => void {
  const history = window.history;
  const push = history.pushState;
  const replace = history.replaceState;
  const id = Array.from(window.crypto.getRandomValues(new Uint32Array(4)));
  documentId = id;

  const pushWithPosition: History["pushState"] = (state, unused, url) => {
    push.call(history, { ...state, [positionKey]: { id, depth: readDepth() + 1 } }, unused, url);
  };
  const replaceWithPosition: History["replaceState"] = (state, unused, url) => {
    replace.call(history, { ...state, [positionKey]: { id, depth: readDepth() } }, unused, url);
  };
  history.pushState = pushWithPosition;
  history.replaceState = replaceWithPosition;

  return () => {
    if (history.pushState === pushWithPosition) history.pushState = push;
    if (history.replaceState === replaceWithPosition) history.replaceState = replace;
    if (documentId === id) documentId = undefined;
  };
}

export function DocumentHistoryTracker() {
  useEffect(() => {
    if (!(window as Window & { navigation?: unknown }).navigation) return trackDocumentHistory();
  }, []);
  return null;
}
