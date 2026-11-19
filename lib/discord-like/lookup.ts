import { guilds } from "./data/guilds";
import { users } from "./data/users";
import { voiceStates } from "./data/voice-states";
import type { Channel, Guild, User, VoiceState } from "./types";

/**
 * クライアント部品が使う参照系。
 * メッセージ本文（data/messages/*）は import しないので、ここを経由しても
 * 本文がクライアントのバンドルに入らない。メッセージはサーバー経由で取得する。
 */
const copyOf = <T>(value: T): T => structuredClone(value);

const byPosition = (a: { position: number }, b: { position: number }): number =>
  a.position - b.position;

export function listGuilds(): Guild[] {
  return copyOf(guilds);
}

export function getGuild(id: string): Guild | undefined {
  const guild = guilds.find((candidate) => candidate.id === id);
  return guild ? copyOf(guild) : undefined;
}

export function getGuildByUrlId(urlId: string): Guild | undefined {
  const guild = guilds.find((candidate) => candidate.urlId === urlId);
  return guild ? copyOf(guild) : undefined;
}

export function listChannels(guildId: string): Channel[] {
  const guild = guilds.find((candidate) => candidate.id === guildId);
  if (!guild) {
    return [];
  }
  return copyOf([...guild.channels].sort(byPosition));
}

export function getChannel(id: string): Channel | undefined {
  for (const guild of guilds) {
    const channel = guild.channels.find((candidate) => candidate.id === id);
    if (channel) {
      return copyOf(channel);
    }
  }
  return undefined;
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

export function listUsers(): User[] {
  return copyOf(users);
}

export function getUser(id: string): User | undefined {
  const user = users.find((candidate) => candidate.id === id);
  return user ? copyOf(user) : undefined;
}

export function listVoiceStates(channelId: string): VoiceState[] {
  return copyOf(voiceStates.filter((state) => state.channelId === channelId));
}
