/**
 * Note風（長文ブログ）UI が使うドメイン型。値は lib/note-like/data/*.ts に置く。
 * ID は URL に入る安全な文字（英小文字 / 数字 / ハイフン / アンダースコア）。
 * 時刻は "+09:00" 付きの ISO 8601 固定文字列。
 */

export type Creator = {
  /** URL に入るID（/note/{id}） */
  id: string;
  displayName: string;
  bio: string;
  /** アバター画像（public からのパス。例: "/note-like/avatars/mai.svg"）。無ければ頭文字で描く */
  avatar?: string;
  /** 画像が無いときのアバターの地色（HEX） */
  avatarColor: string;
};

export type ArticleBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "quote"; text: string }
  /**
   * 本文中の画像。alt は内容の説明、caption は画像の下に出す一言。
   * href を渡すと、その画像の原寸を新しいタブで開ける（縮小表示で読めない文字がある場合）。
   */
  | {
      kind: "image";
      src: string;
      alt: string;
      width: number;
      height: number;
      caption?: string;
      href?: string;
      /** 原寸リンクのアクセシブル名 */
      hrefLabel?: string;
    }
  | { kind: "divider" };

export type Article = {
  /** URL に入るID（/note/{creatorId}/n/{id}） */
  id: string;
  creatorId: string;
  title: string;
  /** 一覧カードに出す要約 */
  excerpt: string;
  /** 見出し画像（public からのパス。横長 1.91:1）。無い記事もある */
  cover?: string;
  publishedAt: string;
  tags: string[];
  likeCount: number;
  body: ArticleBlock[];
};
