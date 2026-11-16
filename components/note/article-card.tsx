import Link from "next/link";
import {
  type Article,
  articleHref,
  type Creator,
  creatorHref,
  formatPublishedAt,
} from "@/lib/note";
import { CreatorAvatar } from "./creator-avatar";

export function ArticleCard({ article, creator }: { article: Article; creator: Creator }) {
  const [from, to] = article.coverColors;
  return (
    <article className="flex flex-col">
      <Link href={articleHref(article)} className="group flex flex-col gap-3">
        <div
          aria-hidden="true"
          className="aspect-[1.91/1] rounded-lg transition-opacity group-hover:opacity-85"
          style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
        />
        <h2 className="line-clamp-2 text-base leading-snug font-bold group-hover:underline">
          {article.title}
        </h2>
        <p className="line-clamp-2 text-sm leading-relaxed text-(--note-text-muted)">
          {article.excerpt}
        </p>
      </Link>
      <div className="mt-3 flex items-center gap-2 text-xs text-(--note-text-muted)">
        <Link
          href={creatorHref(creator.id)}
          className="flex min-w-0 items-center gap-2 hover:underline"
        >
          <CreatorAvatar creator={creator} size="sm" />
          <span className="truncate">{creator.displayName}</span>
        </Link>
        <time dateTime={article.publishedAt} className="shrink-0">
          {formatPublishedAt(article.publishedAt)}
        </time>
        <span className="ml-auto shrink-0">♡ {article.likeCount}</span>
      </div>
    </article>
  );
}
