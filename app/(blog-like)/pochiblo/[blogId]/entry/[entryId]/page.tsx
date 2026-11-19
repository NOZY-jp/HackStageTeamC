import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogFrame } from "@/components/blog-like/blog-frame";
import { EntryBody } from "@/components/blog-like/entry-body";
import { EntryDate, EntryFooter } from "@/components/blog-like/entry-meta";
import { blogPath, entryPath, getBlog, getEntry, listBlogs, listEntries } from "@/lib/blog-like";

type Props = PageProps<"/pochiblo/[blogId]/entry/[entryId]">;

export function generateStaticParams() {
  return listBlogs().flatMap((blog) =>
    listEntries(blog.id).map((entry) => ({ blogId: blog.id, entryId: entry.id })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { blogId, entryId } = await params;
  const blog = getBlog(blogId);
  const entry = getEntry(blogId, entryId);
  return blog && entry ? { title: { absolute: `${entry.title} - ${blog.title}` } } : {};
}

export default async function EntryPage({ params }: Props) {
  const { blogId, entryId } = await params;
  const blog = getBlog(blogId);
  const entry = getEntry(blogId, entryId);
  if (!blog || !entry) {
    notFound();
  }

  // 前後の記事（古い方が「前」）
  const all = listEntries(blog.id);
  const index = all.findIndex((candidate) => candidate.id === entry.id);
  const newer = all[index - 1];
  const older = all[index + 1];

  return (
    <BlogFrame blog={blog}>
      <article className="pb-entry">
        <EntryDate entry={entry} />
        <h1 className="pb-entry-title">{entry.title}</h1>
        <EntryBody blocks={entry.body} />
        <EntryFooter entry={entry} />
      </article>
      <nav className="pb-pager" aria-label="前後の記事">
        {older ? <Link href={entryPath(blog.id, older.id)}>« 前の記事</Link> : <span />}
        <Link href={blogPath(blog.id)}>トップページへ</Link>
        {newer ? <Link href={entryPath(blog.id, newer.id)}>次の記事 »</Link> : <span />}
      </nav>
    </BlogFrame>
  );
}
