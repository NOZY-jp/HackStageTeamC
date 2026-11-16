import { dmThreads } from "./data/dm-threads";
import { guilds } from "./data/guilds";
import { channelMessages, dmMessages } from "./data/messages";
import { users } from "./data/users";
import { voiceStates } from "./data/voice-states";
import type { Channel, DMThread, Guild, Message, User, VoiceState } from "./types";

/** すべて同期・純関数。内部配列はコピーして返し、呼び出し側から書き換えられないようにする。 */

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
  return [...guilds];
}

export function getGuild(id: string): Guild | undefined {
  return guilds.find((guild) => guild.id === id);
}

export function listChannels(guildId: string): Channel[] {
  const guild = getGuild(guildId);
  if (!guild) {
    return [];
  }
  return [...guild.channels].sort(byPosition);
}

/** 戻り値の Channel は kind が "text" | "voice" のリテラル型なので、そのまま絞り込める。 */
export function getChannel(id: string): Channel | undefined {
  for (const guild of guilds) {
    const channel = guild.channels.find((candidate) => candidate.id === id);
    if (channel) {
      return channel;
    }
  }
  return undefined;
}

/** チャンネルIDで引く（DM スレッドIDとは別名前空間）。 */
export function listMessages(channelId: string): Message[] {
  return [...(channelMessages[channelId] ?? [])].sort(bySentAt);
}

export function getUser(id: string): User | undefined {
  return users.find((user) => user.id === id);
}

export function listDMThreads(): DMThread[] {
  return [...dmThreads].sort(byLastMessageAtDesc);
}

export function getDMThread(id: string): DMThread | undefined {
  return dmThreads.find((thread) => thread.id === id);
}

/** DM スレッドIDで引く（チャンネルIDとは別名前空間）。 */
export function listDMMessages(threadId: string): Message[] {
  return [...(dmMessages[threadId] ?? [])].sort(bySentAt);
}

export function listVoiceStates(channelId: string): VoiceState[] {
  return voiceStates.filter((state) => state.channelId === channelId);
}
