import { dmThreads } from "./data/dm-threads";
import { guilds } from "./data/guilds";
import { channelMessages, dmMessages } from "./data/messages";
import { users } from "./data/users";
import { voiceSessions } from "./data/voice-sessions";
import { voiceStates } from "./data/voice-states";
import type {
  Channel,
  DMThread,
  Guild,
  Message,
  MessagePage,
  User,
  VoiceSession,
  VoiceState,
} from "./types";

/**
 * すべて同期・純関数。data/*.ts の保存オブジェクトは共有しているため、
 * 返す値は毎回ディープコピーする（呼び出し側の書き換えが内部状態に波及しない）。
 * structuredClone は Node 24 と Next.js のサーバー／クライアント両方で使える。
 */
const copyOf = <T>(value: T): T => structuredClone(value);

const byPosition = (a: { position: number }, b: { position: number }): number =>
  a.position - b.position;
const bySentAt = (a: Message, b: Message): number => a.sentAt.localeCompare(b.sentAt);
const byLastMessageAtDesc = (a: DMThread, b: DMThread): number =>
  b.lastMessageAt.localeCompare(a.lastMessageAt);

/**
 * Guild 型に position は無い（#4 の型定義どおり）ため、定義順を position 順とみなして返す。
 * 並べ替えの基準が増えたら型と一緒に見直す。
 */
export function listGuilds(): Guild[] {
  return copyOf(guilds);
}

export function getGuild(id: string): Guild | undefined {
  const guild = guilds.find((candidate) => candidate.id === id);
  return guild ? copyOf(guild) : undefined;
}

export function listChannels(guildId: string): Channel[] {
  const guild = guilds.find((candidate) => candidate.id === guildId);
  if (!guild) {
    return [];
  }
  return copyOf([...guild.channels].sort(byPosition));
}

/** 戻り値の Channel は kind が "text" | "voice" のリテラル型なので、そのまま絞り込める。 */
export function getChannel(id: string): Channel | undefined {
  for (const guild of guilds) {
    const channel = guild.channels.find((candidate) => candidate.id === id);
    if (channel) {
      return copyOf(channel);
    }
  }
  return undefined;
}

const DEFAULT_PAGE_SIZE = 50;

/** カーソル方式で「before の1つ前から limit 件」を切り出す（同梱データを切るだけ）。 */
function paginate(source: Message[], options: { before?: string; limit?: number }): MessagePage {
  const limit = Math.max(1, options.limit ?? DEFAULT_PAGE_SIZE);
  const sorted = [...source].sort(bySentAt);

  let end = sorted.length;
  if (options.before !== undefined) {
    const index = sorted.findIndex((message) => message.id === options.before);
    // 存在しないカーソルは「先頭まで遡り切った」ではなく、最新ページに戻す
    end = index === -1 ? sorted.length : index;
  }

  const start = Math.max(0, end - limit);
  const slice = sorted.slice(start, end);
  const hasMore = start > 0;

  return {
    messages: copyOf(slice),
    hasMore,
    nextCursor: hasMore && slice.length > 0 ? slice[0].id : null,
  };
}

/** チャンネルIDで引く（DM スレッドIDとは別名前空間）。既定は最新50件。 */
export type { MessageAuthor, MessagePage, MessageView, VoiceSession } from "./types";

export function listMessages(options: {
  channelId: string;
  before?: string;
  limit?: number;
}): MessagePage {
  return paginate(channelMessages[options.channelId] ?? [], options);
}

export function getUser(id: string): User | undefined {
  const user = users.find((candidate) => candidate.id === id);
  return user ? copyOf(user) : undefined;
}

export function listDMThreads(): DMThread[] {
  return copyOf([...dmThreads].sort(byLastMessageAtDesc));
}

export function getDMThread(id: string): DMThread | undefined {
  const thread = dmThreads.find((candidate) => candidate.id === id);
  return thread ? copyOf(thread) : undefined;
}

/** DM スレッドIDで引く（チャンネルIDとは別名前空間）。既定は最新50件。 */
export function listDMMessages(options: {
  threadId: string;
  before?: string;
  limit?: number;
}): MessagePage {
  return paginate(dmMessages[options.threadId] ?? [], options);
}

/**
 * 指定メッセージを含むところまで古いページを遡り、そこから最新までの連続した範囲を返す。
 * #69 の検索ジャンプ（未読込のメッセージへ移動）で使う想定。
 * found=false のときは先頭まで遡った結果（存在しないID）を返す。
 */
export function loadUntil(options: {
  channelId?: string;
  threadId?: string;
  messageId: string;
  chunkSize?: number;
}): MessagePage & { found: boolean } {
  const chunkSize = options.chunkSize ?? DEFAULT_PAGE_SIZE;
  const source = options.threadId
    ? (dmMessages[options.threadId] ?? [])
    : (channelMessages[options.channelId ?? ""] ?? []);

  const loaded: Message[] = [];
  let page = paginate(source, { limit: chunkSize });

  while (true) {
    loaded.unshift(...page.messages);
    if (page.messages.some((message) => message.id === options.messageId)) {
      break;
    }
    if (!page.hasMore || page.nextCursor === null) {
      break;
    }
    page = paginate(source, { before: page.nextCursor, limit: chunkSize });
  }

  return {
    messages: copyOf(loaded),
    hasMore: page.hasMore,
    nextCursor: page.hasMore && loaded.length > 0 ? loaded[0].id : null,
    found: loaded.some((message) => message.id === options.messageId),
  };
}

/** URL の数値ID（urlId）から引く。見つからなければ undefined。 */
export function getGuildByUrlId(urlId: string): Guild | undefined {
  const guild = guilds.find((candidate) => candidate.urlId === urlId);
  return guild ? copyOf(guild) : undefined;
}

export function getChannelByUrlId(urlId: string): Channel | undefined {
  for (const guild of guilds) {
    const channel = guild.channels.find((candidate) => candidate.urlId === urlId);
    if (channel) {
      return copyOf(channel);
    }
  }
  return undefined;
}

export function getDMThreadByUrlId(urlId: string): DMThread | undefined {
  const thread = dmThreads.find((candidate) => candidate.urlId === urlId);
  return thread ? copyOf(thread) : undefined;
}

/** 通話セッション（#129）。scope や channel で絞れる。 */
export function listVoiceSessions(options?: {
  channelId?: string;
  scope?: "dm" | "guild";
}): VoiceSession[] {
  return copyOf(
    voiceSessions.filter(
      (session) =>
        (!options?.channelId || session.channelId === options.channelId) &&
        (!options?.scope || session.scope === options.scope),
    ),
  );
}

export function listVoiceStates(channelId: string): VoiceState[] {
  return copyOf(voiceStates.filter((state) => state.channelId === channelId));
}
