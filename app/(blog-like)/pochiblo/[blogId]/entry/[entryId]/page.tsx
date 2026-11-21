import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogFrame } from "@/components/blog-like/blog-frame";
import { EntryBody } from "@/components/blog-like/entry-body";
import { EntryComments } from "@/components/blog-like/entry-comments";
import { EntryDate, EntryFooter } from "@/components/blog-like/entry-meta";
import { StoryGoto } from "@/components/common/story/story-goto";
import {
  blogPath,
  entryPath,
  getBlog,
  getEntry,
  listAllEntries,
  listBlogs,
  listPublicEntries,
} from "@/lib/blog-like";
import { PHOTO_CONTEST_RESULT_PATH } from "@/lib/seo/contest";
import { entryDescription } from "@/lib/seo/description";
import { canonicalUrl } from "@/lib/seo/site";

// 記事は params から引くので、トップレベルで params を待つ＝URL データを読むことになる。
// Cache Components（PPR）のままだと「params が <Suspense> の外で読まれている」警告が出るため、
// この区画はブロックを許可する（twitter-like の詳細ルートと同じ扱い）。
// ここは静的データだけなので待ち時間は無く、存在しない記事は 404 のまま返せる。
export const instant = false;

type Props = PageProps<"/pochiblo/[blogId]/entry/[entryId]">;

export function generateStaticParams() {
  return listBlogs().flatMap((blog) =>
    listAllEntries(blog.id).map((entry) => ({ blogId: blog.id, entryId: entry.id })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { blogId, entryId } = await params;
  const blog = getBlog(blogId);
  const entry = getEntry(blogId, entryId);
  if (!blog || !entry) {
    return {};
  }
  return {
    // 記事タイトルをそのまま title にする（ブログ名は付けない）
    title: { absolute: entry.title },
    description: entryDescription(entry.body),
    alternates: { canonical: canonicalUrl(entryPath(blogId, entry.id)) },
    // 限定公開の記事はインデックスさせない（公開以外は一律・安全側）。リンクはたどらせる
    ...(entry.visibility !== "public" ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function EntryPage({ params }: Props) {
  const { blogId, entryId } = await params;
  const blog = getBlog(blogId);
  const entry = getEntry(blogId, entryId);
  if (!blog || !entry) {
    notFound();
  }

  // 前後の記事（古い方が「前」）。たどれるのは公開中の記事どうしだけ（限定公開の記事からは前後へ進めない）
  const visible = entry.visibility === "public" ? listPublicEntries(blog.id) : [];
  const index = visible.findIndex((candidate) => candidate.id === entry.id);
  const newer = index > 0 ? visible[index - 1] : undefined;
  const older = index >= 0 ? visible[index + 1] : undefined;

  return (
    <BlogFrame blog={blog}>
      <article className="pb-entry">
        <EntryDate entry={entry} />
        <h1 className="pb-entry-title">{entry.title}</h1>
        <EntryBody blocks={entry.body} />
        <EntryFooter entry={entry} />
        {/* 受賞した記事から結果ページへ進む（本番ではこの操作で順序7が立つ・#119） */}
        {entry.id === "e20181117" ? (
          <p className="pb-contest-link">
            <StoryGoto href={PHOTO_CONTEST_RESULT_PATH} flag="s07-contest-entry">
              結果ページを見る
            </StoryGoto>
          </p>
        ) : null}
        <EntryComments comments={entry.comments} />
      </article>
      <nav className="pb-pager" aria-label="前後の記事">
        {older ? <Link href={entryPath(blog.id, older.id)}>« 前の記事</Link> : <span />}
        <Link href={blogPath(blog.id)}>トップページへ</Link>
        {newer ? <Link href={entryPath(blog.id, newer.id)}>次の記事 »</Link> : <span />}
      </nav>
    </BlogFrame>
  );
}
