import { LEAF_CREATOR_ID } from "../blog-migration/articles";
import { articles } from "./data/articles";
import { creators } from "./data/creators";
import type { Article, Creator } from "./types";

export type { Article, ArticleBlock, Creator } from "./types";

/** サービス名（作中の架空サービス） */
export const SERVICE_NAME = "leaf";

/**
 * すべて同期・純関数。data/*.ts の保存オブジェクトは共有しているため、
 * 返す値は毎回ディープコピーする（lib/discord-like と同じ方針）。
 */
const copyOf = <T>(value: T): T => structuredClone(value);

const byPublishedAtDesc = (a: Article, b: Article): number =>
  b.publishedAt.localeCompare(a.publishedAt);

export function listCreators(): Creator[] {
  return copyOf(creators);
}

export function getCreator(id: string): Creator | undefined {
  const creator = creators.find((candidate) => candidate.id === id);
  return creator ? copyOf(creator) : undefined;
}

/** 全記事（新しい順） */
export function listArticles(): Article[] {
  return copyOf([...articles].sort(byPublishedAtDesc));
}

/** トップでは新着順を基本に、同じ書き手の3本目を次の書き手の後ろに回す。 */
export function listTopArticles(): Article[] {
  const pending = listArticles().filter(({ creatorId }) => creatorId !== LEAF_CREATOR_ID);
  const ranked: Article[] = [];
  while (pending.length > 0) {
    const previous = ranked.at(-1)?.creatorId;
    const avoid = previous === ranked.at(-2)?.creatorId ? previous : undefined;
    const next = pending.findIndex(({ creatorId }) => creatorId !== avoid);
    // 他の書き手の記事が残っていない場合も、記事は落とさない。
    ranked.push(...pending.splice(Math.max(0, next), 1));
  }
  return ranked;
}

/** 書き手の記事（新しい順） */
export function listArticlesByCreator(creatorId: string): Article[] {
  return listArticles().filter((article) => article.creatorId === creatorId);
}

export function getArticle(creatorId: string, articleId: string): Article | undefined {
  const article = articles.find(
    (candidate) => candidate.creatorId === creatorId && candidate.id === articleId,
  );
  return article ? copyOf(article) : undefined;
}

export function articleHref(article: Article): string {
  return `/note/${article.creatorId}/n/${article.id}`;
}

export function creatorHref(creatorId: string): string {
  return `/note/${creatorId}`;
}

export function tagHref(tag: string): string {
  return `/note/search?q=${encodeURIComponent(tag)}`;
}

/** 検索語を、小文字・先頭の # なしの語に分ける。 */
function toTerms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.replace(/^#/, ""))
    .filter(Boolean);
}

/**
 * 記事が検索語に一致するか。空白区切りの語をすべて含むときに一致とする。
 * 対象はタイトル・要約・本文・タグ・書き手の名前/自己紹介/ID。大文字小文字と先頭の # は無視する。
 */
export function matchesQuery(
  article: Article,
  creator: Creator | undefined,
  query: string,
): boolean {
  const terms = toTerms(query);
  if (terms.length === 0) {
    return false;
  }
  const haystack = [
    article.title,
    article.excerpt,
    ...article.tags,
    ...article.body.map((block) => ("text" in block ? block.text : "")),
    creator?.displayName ?? "",
    creator?.bio ?? "",
    article.creatorId,
  ]
    .join("\n")
    .toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

/** 検索語に一致する記事（新しい順）。 */
export function searchArticles(query: string): Article[] {
  return listArticles().filter((article) =>
    matchesQuery(article, getCreator(article.creatorId), query),
  );
}

/**
 * "2026-11-18T23:40:00+09:00" → "2026年11月18日 23:40"（style="date" なら日付まで）。
 * 文字列をそのまま切り出すので、実行環境のタイムゾーンやロケールに結果が左右されない。
 */
export function formatPublishedAt(iso: string, style: "datetime" | "date" = "datetime"): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!match) {
    return iso;
  }
  const [, year, month, day, hour, minute] = match;
  const date = `${year}年${Number(month)}月${Number(day)}日`;
  return style === "date" ? date : `${date} ${hour}:${minute}`;
}
