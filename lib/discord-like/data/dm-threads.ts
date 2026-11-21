import type { DMThread } from "../types";
import { messagesByDMThread } from "./messages/dm-expanded";

/**
 * DM スレッド。lastMessageAt は最終メッセージと同じ固定値。
 * カイとの DM は、調査の進捗（結末を含む）を公開チャンネルに出さないための非公開の場（#121）。
 */
export const dmThreads: DMThread[] = [
  ...(
    [
      ["dm-maimai", "1187002356428841501", "maimai"],
      ["dm-kai", "1187002356428841502", "kai"],
    ] as const
  ).map(([id, urlId, personId]) => {
    const list = messagesByDMThread[id] ?? [];
    const lastMine = list.map((message) => message.authorId).lastIndexOf("hal");
    return {
      id,
      urlId,
      participantIds: ["hal", personId] as [string, string],
      lastMessageAt: list[list.length - 1]?.sentAt ?? "2026-11-19T23:52:00+09:00",
      unreadCount: Math.max(0, list.length - 1 - lastMine),
    };
  }),
  // #133 で追加した7本（urlId は 1503〜1509 の帯）
  ...(
    [
      ["dm-taku", "1187002356428841503", "taku"],
      ["dm-jun", "1187002356428841504", "jun"],
      ["dm-miyu", "1187002356428841505", "miyu"],
      ["dm-yama", "1187002356428841506", "yama"],
      ["dm-ootsuka", "1187002356428841507", "ootsuka"],
      ["dm-hayashi", "1187002356428841508", "hayashi"],
      ["dm-gunlance", "1187002356428841509", "gunlance"],
    ] as const
  ).map(([id, urlId, personId]) => {
    const list = messagesByDMThread[id] ?? [];
    return {
      id,
      urlId,
      participantIds: ["hal", personId] as [string, string],
      lastMessageAt: list[list.length - 1]?.sentAt ?? "2026-11-19T23:52:00+09:00",
      unreadCount: Math.max(
        0,
        list.length - 1 - list.map((message) => message.authorId).lastIndexOf("hal"),
      ),
    };
  }),
];
