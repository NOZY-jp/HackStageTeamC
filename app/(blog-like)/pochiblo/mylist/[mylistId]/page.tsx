import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogFrame } from "@/components/blog-like/blog-frame";
import {
  entryPath,
  formatDate,
  getBlog,
  getMylist,
  listMylistEntries,
  listMylists,
} from "@/lib/blog-like";

// マイリストも params から引くので、トップレベルで params を待つ＝URL データを読むことになる。
// Cache Components（PPR）のままだと「params が <Suspense> の外で読まれている」警告が出るため、
// この区画はブロックを許可する（twitter-like の詳細ルートと同じ扱い）。
// ここは静的データだけなので待ち時間は無く、存在しないマイリストは 404 のまま返せる。
export const instant = false;

type Props = PageProps<"/pochiblo/mylist/[mylistId]">;

export function generateStaticParams() {
  return listMylists().map((mylist) => ({ mylistId: mylist.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const mylist = getMylist((await params).mylistId);
  // マイリストは常に noindex（記事一覧が出ると全記事タイトルが検索に載るため）。リンクはたどらせる
  return mylist
    ? { title: `マイリスト：${mylist.title}`, robots: { index: false, follow: true } }
    : { robots: { index: false, follow: true } };
}

/** マイリスト。限定公開の記事も、ここからなら開ける（ブログのトップからはたどれない）。 */
export default async function MylistPage({ params }: Props) {
  const mylist = getMylist((await params).mylistId);
  const blog = mylist ? getBlog(mylist.blogId) : undefined;
  if (!mylist || !blog) {
    notFound();
  }
  const entries = listMylistEntries(mylist);

  return (
    <BlogFrame blog={blog}>
      <section className="pb-mylist">
        <p className="pb-entry-date">マイリスト</p>
        <h1 className="pb-entry-title">{mylist.title}</h1>
        <p className="pb-mylist-count">{entries.length}件</p>
        <table className="pb-mylist-table">
          <thead>
            <tr>
              <th scope="col">日付</th>
              <th scope="col">タイトル</th>
              <th scope="col">カテゴリ</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="pb-mylist-date">{formatDate(entry.publishedAt, "date")}</td>
                <td>
                  <Link href={entryPath(blog.id, entry.id)}>{entry.title}</Link>
                  {entry.visibility === "unlisted" ? (
                    <span className="pb-unlisted">限定公開</span>
                  ) : null}
                </td>
                <td>{entry.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </BlogFrame>
  );
}
