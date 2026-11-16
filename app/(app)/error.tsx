"use client";

/** 表示中の例外。文言は未検出（無い）と混ぜない（壊れた）。 */
export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="route-state" role="alert">
      <p className="route-state-code" aria-hidden="true">
        !
      </p>
      <h1 className="route-state-title">表示できませんでした</h1>
      <p className="route-state-description">一時的な問題の可能性があります。</p>
      <button type="button" className="route-state-link" onClick={reset}>
        再試行
      </button>
    </div>
  );
}
