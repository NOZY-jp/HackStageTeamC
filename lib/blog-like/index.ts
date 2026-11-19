import { blogs, entries, mylists } from "./data/blog";
import type { Blog, Entry, Mylist } from "./types";

export type { Blog, Entry, EntryBlock, Mylist } from "./types";
export * from "./url";

/** ブログサービス名（作中の架空サービス） */
export const BLOG_SERVICE_NAME = "ぽちブロ";

/** すべて同期・純関数。返す値は毎回ディープコピーする（他の lib と同じ方針）。 */
const copyOf = <T>(value: T): T => structuredClone(value);

const byPublishedAtDesc = (a: Entry, b: Entry): number =>
  b.publishedAt.localeCompare(a.publishedAt);

export function listBlogs(): Blog[] {
  return copyOf(blogs);
}

export function getBlog(id: string): Blog | undefined {
  const blog = blogs.find((candidate) => candidate.id === id);
  return blog ? copyOf(blog) : undefined;
}

/** ブログの全記事（限定公開も含む。新しい順）。ページ生成とマイリスト用 */
export function listAllEntries(blogId: string): Entry[] {
  return copyOf(entries.filter((entry) => entry.blogId === blogId).sort(byPublishedAtDesc));
}

/** 公開中の記事だけ（新しい順）。トップ・サイドバーに出すのはこれだけ */
export function listPublicEntries(blogId: string): Entry[] {
  return listAllEntries(blogId).filter((entry) => entry.visibility === "public");
}

/** 記事を1件。限定公開でも URL を知っていれば開けるので返す */
export function getEntry(blogId: string, entryId: string): Entry | undefined {
  const entry = entries.find(
    (candidate) => candidate.blogId === blogId && candidate.id === entryId,
  );
  return entry ? copyOf(entry) : undefined;
}

/** 公開中の記事のカテゴリと記事数（記事の多い順、同数なら名前順） */
export function listCategories(blogId: string): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const entry of listPublicEntries(blogId)) {
    counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1);
  }
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** 公開中の記事の月別の数（新しい月から）。"2018-01" の形 */
export function listMonths(blogId: string): { month: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const entry of listPublicEntries(blogId)) {
    const month = entry.publishedAt.slice(0, 7);
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }
  return [...counts].map(([month, count]) => ({ month, count }));
}

export function listMylists(): Mylist[] {
  return copyOf(mylists);
}

export function getMylist(id: string): Mylist | undefined {
  const mylist = mylists.find((candidate) => candidate.id === id);
  return mylist ? copyOf(mylist) : undefined;
}

/** マイリストの記事（マイリストの並び順） */
export function listMylistEntries(mylist: Mylist): Entry[] {
  return mylist.entryIds.flatMap((entryId) => {
    const entry = getEntry(mylist.blogId, entryId);
    return entry ? [entry] : [];
  });
}
