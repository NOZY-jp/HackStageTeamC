import Link from "next/link";
import { type Article, articleHref, type Creator, formatPublishedAt } from "@/lib/note-like";
import { ArticleCover } from "./article-cover";
import { HeartIcon } from "./icons";

/**
 * 縦に並べる記事行（左に文章、右に見出し画像）。
 * 書き手が自明でない場所（検索結果など）では creator を渡すと名前を出す。
 */
export function ArticleListItem({ article, creator }: { article: Article; creator?: Creator }) {
  return (
    <article className="note-row">
      <Link href={articleHref(article)} className="note-row-link">
        <div className="note-row-text">
          <h3 className="note-row-title">{article.title}</h3>
          <p className="note-row-excerpt">{article.excerpt}</p>
        </div>
        <ArticleCover article={article} className="note-row-cover" />
      </Link>
      <div className="note-row-meta">
        {creator ? <span>{creator.displayName}</span> : null}
        <time dateTime={article.publishedAt}>{formatPublishedAt(article.publishedAt)}</time>
        <span className="note-like-count">
          <HeartIcon size="sm" />
          {article.likeCount}
        </span>
      </div>
    </article>
  );
}
