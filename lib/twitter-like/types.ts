/**
 * Twitter-like SNS（/twitter 配下）の型。Discord like UI の型とは共有しない
 * （SNS 側のユーザーは "tw-" プレフィックスの独立した ID を持つ）。
 */

export type TwitterUser = {
  id: string;
  displayName: string;
  handle: string;
  /** アバターの地色（HEX） */
  avatarColor: string;
  /** アバターの画像（あれば地色とイニシャルの代わりに出す） */
  avatarSrc?: string;
  /** アバター画像の説明。名前・学校名・地名は書かない */
  avatarAlt?: string;
  /** 鍵アカウント。true のときプロフィール情報は公開のまま投稿一覧だけを隠す */
  protected?: boolean;
};

/** 投稿に添える写真。 */
export type PostMedia = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type Post = {
  /** URL に入る（/twitter/post/[postId]） */
  id: string;
  /** TwitterUser.id */
  authorId: string;
  /** 投稿時刻（ISO 8601・JST オフセット付きの固定文字列） */
  postedAt: string;
  body: string;
  /** 返信先の Post.id。無ければトップレベルの投稿 */
  replyToId?: string;
  /** 添付写真（無ければ本文だけ） */
  media?: PostMedia[];
  replyCount: number;
  repostCount: number;
  likeCount: number;
};

/** プロフィール画面だけで使う付加情報。TwitterUser.id で 1:1 に対応する。 */
export type Profile = {
  userId: string;
  bio: string;
  location?: string;
  /** 参加月（ISO 8601 の日付） */
  joinedAt: string;
  followingCount: number;
  followersCount: number;
};

export type Trend = {
  id: string;
  category: string;
  name: string;
};
