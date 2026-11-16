/**
 * UI が共有するドメイン型。値は lib/mock/data/*.ts に置き、ここでは形だけを決める。
 * ID はすべて文字列・グローバル一意・URL に入る安全な文字（英小文字 / 数字 / ハイフン）。
 * 時刻は ISO 8601 の固定文字列。
 */

export type User = {
  id: string;
  displayName: string;
  handle: string;
  /** アバターの地色（HEX。例: "#5865f2"） */
  avatarColor: string;
  status?: "online" | "idle" | "dnd" | "offline";
  bot?: boolean;
};

export type Category = {
  id: string;
  guildId: string;
  name: string;
  position: number;
};

export type Channel = {
  id: string;
  guildId: string;
  name: string;
  kind: "text" | "voice";
  topic?: string;
  categoryId?: string;
  position: number;
  unreadCount?: number;
  mentionCount?: number;
};

export type Guild = {
  id: string;
  name: string;
  /** アイコンの地色（HEX） */
  iconColor: string;
  initials: string;
  categories: Category[];
  channels: Channel[];
};

export type MessageAttachment = {
  id: string;
  name: string;
  kind: "image" | "file";
  sizeLabel?: string;
};

export type MessageReaction = {
  emoji: string;
  count: number;
  me?: boolean;
};

export type Message = {
  id: string;
  channelId: string;
  authorId: string;
  /** 送信時刻（ISO 8601） */
  sentAt: string;
  body: string;
  replyToId?: string;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  editedAt?: string;
  system?: boolean;
};

export type DMThread = {
  id: string;
  /** DM の参加者2人（グローバル一意な User.id） */
  participantIds: [string, string];
  lastMessageAt: string;
  unreadCount?: number;
};

export type VoiceState = {
  channelId: string;
  userId: string;
  muted?: boolean;
  deafened?: boolean;
  speaking?: boolean;
  joinedAt: string;
};

/* ---- Twitter-like SNS（/twitter 配下）。User は Discord 側と共有する型を再利用する ---- */

export type Post = {
  /** URL に入る（/twitter/post/[postId]） */
  id: string;
  /** User.id（SNS 用ユーザーは lib/mock/data/twitter.ts の twitterUsers） */
  authorId: string;
  /** 投稿時刻（ISO 8601・JST オフセット付きの固定文字列） */
  postedAt: string;
  body: string;
  /** 返信先の Post.id。無ければトップレベルの投稿 */
  replyToId?: string;
  replyCount: number;
  repostCount: number;
  likeCount: number;
};

/** プロフィール画面だけで使う付加情報。User.id で 1:1 に対応する。 */
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
  postCount: number;
};
