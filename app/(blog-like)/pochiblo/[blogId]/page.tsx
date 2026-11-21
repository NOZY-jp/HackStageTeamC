import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogFrame } from "@/components/blog-like/blog-frame";
import { EntryDate, EntryFooter } from "@/components/blog-like/entry-meta";
import { StoryTrigger } from "@/components/common/story/story-trigger";
import { blogPath, entryPath, getBlog, listBlogs, listPublicEntries } from "@/lib/blog-like";
import { canonicalUrl } from "@/lib/seo/site";

// ブログは params から引くので、トップレベルで params を待つ＝URL データを読むことになる。
// Cache Components（PPR）のままだと「params が <Suspense> の外で読まれている」警告が出るため、
// 記事・マイリストのルートと同じく、この区画はブロックを許可する（#86）。
// ここは静的データだけなので待ち時間は無く、存在しないブログは 404 のまま返せる。
export const instant = false;

type Props = PageProps<"/pochiblo/[blogId]">;

export function generateStaticParams() {
  return listBlogs().map((blog) => ({ blogId: blog.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const blog = getBlog((await params).blogId);
  if (!blog) {
    return {};
  }
  return {
    title: { absolute: blog.title },
    description: blog.description,
    alternates: { canonical: canonicalUrl(blogPath(blog.id)) },
  };
}

/** ブログのトップ。公開中の記事だけを新しい順に、冒頭だけ並べる（閉鎖後は閉鎖のお知らせだけ）。 */
export default async function BlogTopPage({ params }: Props) {
  const blog = getBlog((await params).blogId);
  if (!blog) {
    notFound();
  }

  return (
    <BlogFrame blog={blog}>
      {blog.id === "denden0102" ? <StoryTrigger flag="s03-blog-found" /> : null}
      {listPublicEntries(blog.id).map((entry) => {
        const lead = entry.body.find((block) => block.kind === "paragraph");
        return (
          <article key={entry.id} className="pb-entry">
            <EntryDate entry={entry} />
            <h2 className="pb-entry-title">
              <Link href={entryPath(blog.id, entry.id)}>{entry.title}</Link>
            </h2>
            {lead ? <p className="pb-entry-lead">{lead.text}</p> : null}
            <Link href={entryPath(blog.id, entry.id)} className="pb-more">
              続きを読む »
            </Link>
            <EntryFooter entry={entry} />
          </article>
        );
      })}
    </BlogFrame>
  );
}
