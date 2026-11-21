import { generateDmExpansion } from "../../generators/dm-expansion";
import type { Message } from "../../types";
import { messagesByDMThread as baseDmMessages } from "./dm";
import { messagesByChannelMhc } from "./mhc";
import { serversHistory } from "./servers";

/**
 * #133 の DM 拡張を適用した DM スレッド（9本・1,500通）。
 * 生成器は `../../generators/dm-expansion.ts`（seed 固定・決定性テストあり）。
 */
const maimaiDays = new Set(
  (baseDmMessages["dm-maimai"] ?? []).map((message) => message.sentAt.slice(0, 10)),
);
const maimaiList = baseDmMessages["dm-maimai"] ?? [];
const existingCallStarts = maimaiList.filter((message) =>
  message.body.includes("通話を開始しました"),
).length;
const existingLastMaimaiAt =
  maimaiList[maimaiList.length - 1]?.sentAt ?? "2026-11-19T21:48:00+09:00";

const existingTimes = [
  ...Object.values(baseDmMessages).flat(),
  ...Object.values(messagesByChannelMhc).flat(),
  ...Object.values(serversHistory).flat(),
].map((message) => message.sentAt);

const callWindows: { start: number; end: number }[] = [];
let openStart: number | undefined;
for (const message of [...maimaiList].sort((a, b) => a.sentAt.localeCompare(b.sentAt))) {
  if (message.body.includes("通話を開始")) openStart = Date.parse(message.sentAt);
  else if (
    openStart !== undefined &&
    (message.body.includes("通話を終了") || message.body.includes("応答がありません"))
  ) {
    callWindows.push({ start: openStart, end: Date.parse(message.sentAt) });
    openStart = undefined;
  }
}

const { additions, calls } = generateDmExpansion({
  existingTimes,
  existingMaimaiDays: [...maimaiDays],
  existingCallStarts,
  existingCallWindows: callWindows,
  existingLastMaimaiAt,
});

const merged: Record<string, Message[]> = {};
for (const [threadId, list] of Object.entries(baseDmMessages)) {
  merged[threadId] = [...list, ...(additions[threadId] ?? [])].sort((a, b) =>
    a.sentAt.localeCompare(b.sentAt),
  );
}
for (const [threadId, list] of Object.entries(additions)) {
  if (merged[threadId]) continue;
  merged[threadId] = [...list].sort((a, b) => a.sentAt.localeCompare(b.sentAt));
}

export const messagesByDMThread: Record<string, Message[]> = merged;
export const dmCalls = calls;
