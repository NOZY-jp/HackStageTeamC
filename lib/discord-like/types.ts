/**
 * UI が共有するドメイン型。値は lib/discord-like/data/*.ts に置き、ここでは形だけを決める。
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
  /** プロフィールに出すリンク（1本だけ）。作中URLでよい。 */
  profileUrl?: string;
};

export type Category = {
  id: string;
  guildId: string;
  name: string;
  position: number;
};

export type Channel = {
  id: string;
  /** URL に出す Discord 風の数値ID（17〜19桁・グローバル一意）。内部 id とは別。 */
  urlId: string;
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
  /** URL に出す Discord 風の数値ID（17〜19桁・グローバル一意）。内部 id とは別。 */
  urlId: string;
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
  /** ピン留めされているか（サーバーのお知らせなど） */
  pinned?: boolean;
};

export type DMThread = {
  id: string;
  /** URL に出す Discord 風の数値ID（17〜19桁・グローバル一意）。内部 id とは別。 */
  urlId: string;
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

/** カーソル方式の1ページ分（メッセージ本文を含む。サーバーでのみ生成する）。 */
export type MessagePage = {
  messages: Message[];
  /** このページより古いメッセージが残っているか */
  hasMore: boolean;
  /** さらに古いページを取るときに渡すカーソル（このページで最も古いID）。無ければ null */
  nextCursor: string | null;
};

/** クライアントに渡す最小限の書き手情報（本文をクライアントへ送らないための型）。 */
export type MessageAuthor = {
  id: string;
  displayName: string;
  avatarColor: string;
  /** プロフィールのリンク（あれば著者名をリンクにする）。 */
  profileUrl?: string;
};

/** 一覧表示に必要なページ＋書き手。サーバー（Server Action / ページ）から渡す。 */
export type MessageView = {
  messages: Message[];
  hasMore: boolean;
  nextCursor: string | null;
  authors: Record<string, MessageAuthor>;
};

/** メンバー一覧に出す1人分（ハンドル・状態・プロフィールリンク）。 */
export type MemberView = {
  id: string;
  displayName: string;
  handle: string;
  avatarColor: string;
  status?: "online" | "idle" | "dnd" | "offline";
  profileUrl?: string;
};
