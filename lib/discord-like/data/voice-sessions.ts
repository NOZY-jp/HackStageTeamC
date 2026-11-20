import type { Message, VoiceSession } from "../types";
import { messagesByDMThread } from "./messages/dm-expanded";
import { messagesByChannelMhc } from "./messages/mhc";
import { serversHistory } from "./messages/servers";

/**
 * 通話セッション（#129）。
 *
 * 既存のシステムメッセージ（`通話を開始しました` / `通話を終了しました` /
 * `応答がありませんでした` / ボイスチャンネルの `参加`・`退出`）から、
 * **1通話 = 1セッション**になるように導出する。既存メッセージは変更しない（追加のみ）。
 */

const START = /通話を開始しました|ボイスチャンネルに参加しました/;
const END = /通話を終了しました|ボイスチャンネルから退出しました/;
const MISSED = /応答がありませんでした/;
const MAX_MINUTES = 6 * 60;

const groupByChannel = (): Map<string, Message[]> => {
  const groups = new Map<string, Message[]>();
  const push = (channelId: string, messages: Message[]) => {
    if (messages.length === 0) return;
    groups.set(channelId, [...(groups.get(channelId) ?? []), ...messages]);
  };
  for (const [channelId, messages] of Object.entries(messagesByChannelMhc))
    push(channelId, messages);
  for (const [channelId, messages] of Object.entries(serversHistory)) push(channelId, messages);
  for (const [channelId, messages] of Object.entries(messagesByDMThread)) push(channelId, messages);
  for (const messages of groups.values()) messages.sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  return groups;
};

const dmParticipants = new Map<string, string[]>();
for (const [threadId, messages] of Object.entries(messagesByDMThread)) {
  dmParticipants.set(threadId, [...new Set(messages.map((message) => message.authorId))]);
}

const sessions: VoiceSession[] = [];
for (const [channelId, messages] of groupByChannel()) {
  const isDm = dmParticipants.has(channelId);
  const participantIds = (starter: Message, ender?: Message) =>
    isDm
      ? [...new Set([starter.authorId, ...(dmParticipants.get(channelId) ?? [])])]
      : [...new Set([starter.authorId, ...(ender ? [ender.authorId] : [])])];
  const pushSession = (
    starter: Message,
    ender: Message | undefined,
    endedReason: "hangup" | "missed",
  ) => {
    sessions.push({
      id: `${channelId}-vs-${sessions.length + 1}`,
      scope: isDm ? "dm" : "guild",
      channelId,
      participantIds: participantIds(starter, ender),
      startedAt: starter.sentAt,
      ...(ender ? { endedAt: ender.sentAt } : {}),
      endedReason,
    });
  };
  // 開始は待ち行列に積み、終了/不在着信が来たら最も古い開始と対にする
  const pending: Message[] = [];
  for (const message of messages) {
    // システム行だけを対象にする（通常発言に同じ文言があってもセッションにしない）
    if (message.system !== true) continue;
    if (START.test(message.body)) {
      pending.push(message);
      continue;
    }
    if (pending.length === 0) continue;
    if (MISSED.test(message.body)) {
      if (pending.length === 0)
        throw new Error(`応答なしの前に対応する開始がありません: ${message.id}`);
      pushSession(pending.shift() as Message, undefined, "missed");
      continue;
    }
    if (!END.test(message.body)) continue;
    const starter = pending[0];
    const minutes = (Date.parse(message.sentAt) - Date.parse(starter.sentAt)) / 60_000;
    if (minutes < 1 || minutes > MAX_MINUTES) {
      // 黙って missed に読み替えない（データの異常として落とす）
      throw new Error(`通話の長さが範囲外: ${starter.id} → ${message.id} (${minutes}分)`);
    }
    pending.shift();
    pushSession(starter, message, "hangup");
  }
  if (pending.length > 0) {
    // 開始だけで終了が無いものは異常（不在着信は「応答がありませんでした」で表す）
    throw new Error(`開始だけで終了がありません: ${pending.map((m) => m.id).join(", ")}`);
  }
}

/** 通話1回分の長さ（分）。不在着信は0分。 */
export function voiceSessionMinutes(session: VoiceSession): number {
  if (!session.endedAt) return 0;
  return (Date.parse(session.endedAt) - Date.parse(session.startedAt)) / 60_000;
}

export const voiceSessions: VoiceSession[] = sessions;
