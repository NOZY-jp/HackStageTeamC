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
