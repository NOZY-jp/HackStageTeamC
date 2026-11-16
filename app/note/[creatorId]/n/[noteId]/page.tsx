import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CreatorAvatar } from "@/components/note/creator-avatar";
import { LikeButton } from "@/components/note/like-button";
import {
  type ArticleBlock,
  articleHref,
  creatorHref,
  formatPublishedAt,
  getArticle,
  getCreator,
  listArticles,
  listArticlesByCreator,
} from "@/lib/note";

type Props = PageProps<"/note/[creatorId]/n/[noteId]">;

export function generateStaticParams() {
  const params = listArticles().map((article) => ({
    creatorId: article.creatorId,
    noteId: article.id,
  }));
  // cacheComponents では空配列を返せない。記事が0件のあいだは、404 になる仮のパスを1つ返す
  return params.length > 0 ? params : [{ creatorId: "_", noteId: "_" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { creatorId, noteId } = await params;
  const article = getArticle(creatorId, noteId);
  return article ? { title: article.title, description: article.excerpt } : {};
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.kind) {
    case "heading":
      return <h2 className="mt-12 mb-4 text-xl leading-snug font-bold">{block.text}</h2>;
    case "quote":
      return (
        <blockquote className="my-8 border-l-4 border-(--note-line) py-1 pl-5 text-(--note-text-muted)">
          {block.text}
        </blockquote>
      );
    case "divider":
      return <hr className="mx-auto my-10 w-24 border-(--note-line)" />;
    default:
      return <p className="my-6">{block.text}</p>;
  }
}

export default async function ArticlePage({ params }: Props) {
  const { creatorId, noteId } = await params;
  const article = getArticle(creatorId, noteId);
  const creator = getCreator(creatorId);
  if (!article || !creator) notFound();

  const [from, to] = article.coverColors;
  const others = listArticlesByCreator(creator.id)
    .filter((other) => other.id !== article.id)
    .slice(0, 3);

  return (
    <article className="mx-auto max-w-[680px] px-4 py-8">
      <div
        aria-hidden="true"
        className="aspect-[1.91/1] rounded-lg"
        style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      />

      <h1 className="mt-8 text-[1.75rem] leading-normal font-bold sm:text-[2rem]">
        {article.title}
      </h1>

      <div className="mt-6 flex items-center gap-3">
        <Link href={creatorHref(creator.id)} aria-label={`${creator.displayName}のページ`}>
          <CreatorAvatar creator={creator} />
        </Link>
        <div className="min-w-0 text-sm">
          <Link href={creatorHref(creator.id)} className="font-bold hover:underline">
            {creator.displayName}
          </Link>
          <p className="text-(--note-text-muted)">
            <time dateTime={article.publishedAt}>{formatPublishedAt(article.publishedAt)}</time>
          </p>
        </div>
      </div>

      {/* 本文。長文向けに行間を広く取る */}
      <div className="mt-10 text-[1.0625rem] leading-[2]">
        {article.body.map((block, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: 本文ブロックは固定データで並び替えない
          <Block key={index} block={block} />
        ))}
      </div>

      <ul className="mt-12 flex flex-wrap gap-2">
        {article.tags.map((tag) => (
          <li
            key={tag}
            className="rounded-full bg-(--note-bg-subtle) px-3 py-1 text-sm text-(--note-text-muted)"
          >
            #{tag}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <LikeButton initialCount={article.likeCount} />
      </div>

      <aside className="mt-12 rounded-lg bg-(--note-bg-subtle) p-6">
        <div className="flex items-start gap-4">
          <CreatorAvatar creator={creator} />
          <div className="min-w-0">
            <Link href={creatorHref(creator.id)} className="font-bold hover:underline">
              {creator.displayName}
            </Link>
            <p className="mt-1 text-sm leading-relaxed text-(--note-text-muted)">{creator.bio}</p>
          </div>
        </div>
        {others.length > 0 && (
          <div className="mt-6 border-t border-(--note-line) pt-5">
            <h2 className="text-sm font-bold">この人の他の記事</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {others.map((other) => (
                <li key={other.id} className="text-sm">
                  <Link href={articleHref(other)} className="text-(--note-accent) hover:underline">
                    {other.title}
                  </Link>
                  <span className="ml-2 text-xs text-(--note-text-muted)">
                    {formatPublishedAt(other.publishedAt)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </article>
  );
}
