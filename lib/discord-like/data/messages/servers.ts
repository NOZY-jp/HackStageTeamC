import { generateServers, SERVERS_SEED } from "../../generators/servers";
import type { Message } from "../../types";
import { ACQUAINTANCE_NOTES } from "../people/acquaintance-notes";
import { messagesByDMThread as baseDmMessages } from "./dm";
import { messagesByChannelMhc } from "./mhc";

/**
 * mhc 以外の2サーバー（#132）。
 * - univ: 大学の学科（テキスト6・ボイス2）
 * - friend: リア友（テキスト3・ボイス1。MaiMai・かのんは入れない）
 * 中身は `lib/discord-like/generators/servers.ts` が決定的に生成する（seed 固定）。
 * 時刻は mhc・DM（既存分）と衝突しないよう生成時にずらす。
 */
const existingTimes = [
  ...Object.values(messagesByChannelMhc).flat(),
  ...Object.values(baseDmMessages).flat(),
].map((message) => message.sentAt);

const firstSeen: Record<string, string> = {};
for (const [id, note] of Object.entries(ACQUAINTANCE_NOTES)) {
  const match = /^(d{4})-(d{2})/.exec(note.firstSeen);
  if (match) firstSeen[id] = `${match[1]}-${match[2]}`;
}

export const serversHistory: Record<string, Message[]> = generateServers(
  SERVERS_SEED,
  existingTimes,
  firstSeen,
);
