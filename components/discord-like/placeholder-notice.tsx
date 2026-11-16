/** データ接続前のプレースホルダ表示。 */
export function PlaceholderNotice({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <p className="text-base font-semibold text-fg">{title}</p>
      <p className="max-w-md text-sm leading-6 text-fg-muted">{description}</p>
    </div>
  );
}
