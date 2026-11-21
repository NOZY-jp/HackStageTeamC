/**
 * Facebook 風プラットフォーム UI が共有するドメイン型。
 * lib/discord-like とは名前空間を分離し、相互 import は行わない。
 */

export type FbUserStatus = "online" | "idle" | "dnd" | "offline";

export type FbUser = {
  id: string;
  displayName: string;
  handle: string;
  /** アバターの地色（HEX） */
  avatarColor: string;
  /** カバー画像代わりのグラデーション・地色（HEX） */
  coverColor: string;
  status?: FbUserStatus;
  bot?: boolean;
  bio: string;
  workplace?: string;
  location?: string;
  joinedAt: string;
  friendIds: string[];
  /** フォロー中のユーザーID一覧（未指定時は friendIds を使う） */
  followingIds?: string[];
  /** 一覧（連絡先）や通常のあいまい検索に出さない隠しアカウント */
  hiddenFromDirectory?: boolean;
};

export type FbReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry";

export type FbReactionCounts = Partial<Record<FbReactionType, number>>;

export type FbComment = {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  /** ISO 8601 */
  createdAt: string;
  likes: number;
};

export type FbPostAttachment = {
  kind: "link" | "photo";
  title: string;
  subtitle?: string;
  accentColor?: string;
  /** 写真のときの画像（public からのパス） */
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
};

export type FbPost = {
  id: string;
  authorId: string;
  body: string;
  /** ISO 8601 */
  createdAt: string;
  feeling?: string;
  audience: "public" | "friends";
  attachment?: FbPostAttachment;
  reactions: FbReactionCounts;
  myReaction?: FbReactionType;
  comments: FbComment[];
  shares: number;
};
