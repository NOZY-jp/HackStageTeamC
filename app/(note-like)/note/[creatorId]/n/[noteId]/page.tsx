import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LikeButton } from "@/app/(note-like)/_components/like-button";
import { ArticleCover } from "@/components/note-like/article-cover";
import { ArticleListItem } from "@/components/note-like/article-list-item";
import { CreatorAvatar } from "@/components/note-like/creator-avatar";
import {
  type ArticleBlock,
  creatorHref,
  formatPublishedAt,
  getArticle,
  getCreator,
  listArticles,
  listArticlesByCreator,
  tagHref,
} from "@/lib/note-like";

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
      return <h2>{block.text}</h2>;
    case "quote":
      return <blockquote>{block.text}</blockquote>;
    case "image":
      return (
        <figure>
          <Image
            src={block.src}
            alt={block.alt}
            width={block.width}
            height={block.height}
            unoptimized
          />
          {block.caption ? <figcaption>{block.caption}</figcaption> : null}
        </figure>
      );
    case "divider":
      return <hr />;
    default:
      return <p>{block.text}</p>;
  }
}

export default async function ArticlePage({ params }: Props) {
  const { creatorId, noteId } = await params;
  const article = getArticle(creatorId, noteId);
  const creator = getCreator(creatorId);
  if (!article || !creator) {
    notFound();
  }

  const others = listArticlesByCreator(creator.id)
    .filter((other) => other.id !== article.id)
    .slice(0, 3);

  return (
    <div className="note-page" data-width="article">
      {/* 広い画面では、本文の左にスキを浮かせる */}
      <div className="note-article-side">
        <div className="note-article-side-inner">
          <LikeButton initialCount={article.likeCount} layout="column" />
        </div>
      </div>

      <article>
        <ArticleCover article={article} className="note-article-cover" />
        <h1 className="note-article-title">{article.title}</h1>

        <div className="note-byline">
          <Link href={creatorHref(creator.id)} aria-label={`${creator.displayName}のページ`}>
            <CreatorAvatar creator={creator} />
          </Link>
          <div className="note-byline-text">
            <Link href={creatorHref(creator.id)} className="note-byline-name">
              {creator.displayName}
            </Link>
            <p className="note-byline-date">
              <time dateTime={article.publishedAt}>{formatPublishedAt(article.publishedAt)}</time>
            </p>
          </div>
        </div>

        {/* 本文。長文向けに行間を広く取る */}
        <div className="note-body">
          {article.body.map((block, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: 本文ブロックは固定データで並び替えない
            <Block key={index} block={block} />
          ))}
        </div>

        <ul className="note-tags">
          {article.tags.map((tag) => (
            <li key={tag}>
              <Link href={tagHref(tag)} className="note-tag">
                #{tag}
              </Link>
            </li>
          ))}
        </ul>

        {/* 狭い画面では、浮かせる代わりに本文の下へ置く */}
        <div className="note-article-actions">
          <LikeButton initialCount={article.likeCount} />
        </div>
      </article>

      <aside className="note-author">
        <Link href={creatorHref(creator.id)} aria-label={`${creator.displayName}のページ`}>
          <CreatorAvatar creator={creator} />
        </Link>
        <div className="note-author-text">
          <Link href={creatorHref(creator.id)} className="note-byline-name">
            {creator.displayName}
          </Link>
          <p className="note-author-bio">{creator.bio}</p>
        </div>
      </aside>

      {others.length > 0 ? (
        <section className="note-related">
          <h2 className="note-related-title">この人の他の記事</h2>
          {others.map((other) => (
            <ArticleListItem key={other.id} article={other} />
          ))}
        </section>
      ) : null}
    </div>
  );
}
