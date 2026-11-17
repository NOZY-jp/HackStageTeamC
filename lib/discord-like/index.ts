import { dmThreads } from "./data/dm-threads";
import { guilds } from "./data/guilds";
import { channelMessages, dmMessages } from "./data/messages";
import { users } from "./data/users";
import { voiceStates } from "./data/voice-states";
import type { Channel, DMThread, Guild, Message, User, VoiceState } from "./types";

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

/** チャンネルIDで引く（DM スレッドIDとは別名前空間）。 */
export function listMessages(channelId: string): Message[] {
  return copyOf([...(channelMessages[channelId] ?? [])].sort(bySentAt));
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

/** DM スレッドIDで引く（チャンネルIDとは別名前空間）。 */
export function listDMMessages(threadId: string): Message[] {
  return copyOf([...(dmMessages[threadId] ?? [])].sort(bySentAt));
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

export function listVoiceStates(channelId: string): VoiceState[] {
  return copyOf(voiceStates.filter((state) => state.channelId === channelId));
}
