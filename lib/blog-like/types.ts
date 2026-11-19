/**
 * 元のブログ（架空のブログサービス「ぽちブロ」）の型。
 * 本文のリンクは作中の URL（スキームなしの文字列）で持ち、アプリ内のパスへの変換は lib/blog-like/url.ts に集める。
 */

export type Blog = {
  /** ぽちブロのブログID（URL の pochiblo.jp/<id>、アプリ内は /pochiblo/<id>） */
  id: string;
  title: string;
  description: string;
  authorName: string;
  /** サイドバーのプロフィール文 */
  authorProfile: string;
  /** public からのパス */
  avatar: string;
  /** サイドバーのアクセスカウンターに出す数（固定） */
  visitorCount: number;
};

export type EntryBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "heading"; text: string }
  /** 本文中の画像。alt は内容の説明、caption は画像の下に出す一言 */
  | { kind: "image"; src: string; alt: string; width: number; height: number; caption?: string }
  /** 1行のリンク。url は作中の URL（例: "twixer.com/hunter_denden0102/status/..."） */
  | { kind: "link"; lead: string; url: string };

export type Entry = {
  /** URL の pochiblo.jp/<blogId>/entry/<id> */
  id: string;
  blogId: string;
  title: string;
  category: string;
  /** 日本時間の ISO 8601 */
  publishedAt: string;
  /** 記事の下に出すコメント数（コメントの中身は作っていない） */
  commentCount: number;
  /**
   * 公開範囲。public はトップ・サイドバーに出る。unlisted（限定公開）は URL かマイリストからだけ開ける。
   */
  visibility: "public" | "unlisted";
  body: EntryBlock[];
};

/** マイリスト。記事を集めた一覧で、URL を知っている人だけが開ける（ブログのトップからはたどれない）。 */
export type Mylist = {
  /** URL の pochiblo.jp/mylist/<id>、アプリ内は /pochiblo/mylist/<id> */
  id: string;
  blogId: string;
  title: string;
  /** 並び順どおりの記事ID */
  entryIds: string[];
};
