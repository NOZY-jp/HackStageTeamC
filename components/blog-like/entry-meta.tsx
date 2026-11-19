import { type Entry, formatDate, formatDateBand } from "@/lib/blog-like";

/** 記事の上の日付の帯 */
export function EntryDate({ entry }: { entry: Entry }) {
  return (
    <p className="pb-entry-date">
      <time dateTime={entry.publishedAt}>{formatDateBand(entry.publishedAt)}</time>
    </p>
  );
}

/** 記事の下の行（時刻・カテゴリ・コメント数） */
export function EntryFooter({ entry }: { entry: Entry }) {
  return (
    <p className="pb-entry-footer">
      {entry.visibility === "unlisted" ? <span className="pb-unlisted">限定公開</span> : null}
      {formatDate(entry.publishedAt).slice(-5)} | カテゴリ：{entry.category} | コメント(
      {entry.commentCount})
    </p>
  );
}
