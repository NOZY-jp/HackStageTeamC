/**
 * Note風（長文ブログ）UI が使うドメイン型。値は lib/note/data.ts に置く。
 * ID は URL に入る安全な文字（英小文字 / 数字 / ハイフン / アンダースコア）。
 * 時刻は "+09:00" 付きの ISO 8601 固定文字列。
 */

export type Creator = {
  /** URL に入るID（/note/{id}） */
  id: string;
  displayName: string;
  bio: string;
  /** アバターの地色（HEX） */
  avatarColor: string;
  followerCount: number;
  followingCount: number;
};

export type ArticleBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "divider" };

export type Article = {
  /** URL に入るID（/note/{creatorId}/n/{id}） */
  id: string;
  creatorId: string;
  title: string;
  /** 一覧カードに出す要約 */
  excerpt: string;
  /** 見出し画像の代わりに敷くグラデーションの2色（HEX） */
  coverColors: [string, string];
  publishedAt: string;
  tags: string[];
  likeCount: number;
  body: ArticleBlock[];
};
