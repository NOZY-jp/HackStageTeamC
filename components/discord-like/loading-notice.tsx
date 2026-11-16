/** ルート単位の読み込み中表示（loading.tsx の fallback）。 */
export function LoadingNotice({ label }: { label: string }) {
  return (
    <p role="status" className="px-6 py-8 text-sm text-fg-muted">
      {label}…
    </p>
  );
}
