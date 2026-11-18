import Link from "next/link";
import {
  type Article,
  articleHref,
  type Creator,
  creatorHref,
  formatPublishedAt,
} from "@/lib/note-like";
import { ArticleCover } from "./article-cover";
import { CreatorAvatar } from "./creator-avatar";
import { HeartIcon } from "./icons";

/** グリッド用の記事カード（見出し画像・タイトル・書き手・スキ数） */
export function ArticleCard({ article, creator }: { article: Article; creator: Creator }) {
  return (
    <article className="note-card">
      <Link href={articleHref(article)} className="note-card-link">
        {article.cover ? (
          <ArticleCover article={article} />
        ) : (
          <div aria-hidden="true" className="note-cover-empty" />
        )}
        <h2 className="note-card-title">{article.title}</h2>
      </Link>
      <div className="note-card-meta">
        <Link href={creatorHref(creator.id)} className="note-card-creator">
          <CreatorAvatar creator={creator} size="sm" />
          <span className="note-card-creator-name">{creator.displayName}</span>
        </Link>
        <time dateTime={article.publishedAt}>{formatPublishedAt(article.publishedAt, "date")}</time>
        <span className="note-like-count" data-align="end">
          <HeartIcon size="sm" />
          {article.likeCount}
        </span>
      </div>
    </article>
  );
}
