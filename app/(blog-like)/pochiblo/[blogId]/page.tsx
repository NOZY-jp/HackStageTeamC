import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogFrame } from "@/components/blog-like/blog-frame";
import { EntryDate, EntryFooter } from "@/components/blog-like/entry-meta";
import { entryPath, getBlog, listBlogs, listPublicEntries } from "@/lib/blog-like";

type Props = PageProps<"/pochiblo/[blogId]">;

export function generateStaticParams() {
  return listBlogs().map((blog) => ({ blogId: blog.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const blog = getBlog((await params).blogId);
  return blog ? { title: { absolute: blog.title }, description: blog.description } : {};
}

/** ブログのトップ。公開中の記事だけを新しい順に、冒頭だけ並べる（閉鎖後は閉鎖のお知らせだけ）。 */
export default async function BlogTopPage({ params }: Props) {
  const blog = getBlog((await params).blogId);
  if (!blog) {
    notFound();
  }

  return (
    <BlogFrame blog={blog}>
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
