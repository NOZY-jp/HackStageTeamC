"use client";

import { RouteState } from "@/components/note-like/route-state";

/** 表示中の例外。文言は未検出（無い）と混ぜない（壊れた）。 */
export default function NoteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteState
      code="!"
      title="表示できませんでした"
      description="一時的な問題の可能性があります。"
      alert
    >
      <button type="button" className="note-state-link" onClick={reset}>
        再試行
      </button>
    </RouteState>
  );
}
