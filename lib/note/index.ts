import { articles, creators } from "./data";
import type { Article, Creator } from "./types";

export type { Article, ArticleBlock, Creator } from "./types";

/** サービス名（作中の架空サービス） */
export const SERVICE_NAME = "kakioki";

const byNewest = (a: Article, b: Article) => b.publishedAt.localeCompare(a.publishedAt);

export function listCreators(): Creator[] {
  return creators;
}

export function getCreator(id: string): Creator | undefined {
  return creators.find((creator) => creator.id === id);
}

/** 全記事（新しい順） */
export function listArticles(): Article[] {
  return articles.toSorted(byNewest);
}

/** クリエイターの記事（新しい順） */
export function listArticlesByCreator(creatorId: string): Article[] {
  return articles.filter((article) => article.creatorId === creatorId).toSorted(byNewest);
}

export function getArticle(creatorId: string, articleId: string): Article | undefined {
  return articles.find((article) => article.creatorId === creatorId && article.id === articleId);
}

export function articleHref(article: Article): string {
  return `/note/${article.creatorId}/n/${article.id}`;
}

export function creatorHref(creatorId: string): string {
  return `/note/${creatorId}`;
}

/**
 * "2026-11-18T23:40:00+09:00" → "2026年11月18日 23:40"。
 * データは日本時間の固定文字列なので、実行環境のタイムゾーンに左右されないよう文字列から直接組み立てる。
 */
export function formatPublishedAt(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!match) return iso;
  const [, year, month, day, hour, minute] = match;
  return `${year}年${Number(month)}月${Number(day)}日 ${hour}:${minute}`;
}
