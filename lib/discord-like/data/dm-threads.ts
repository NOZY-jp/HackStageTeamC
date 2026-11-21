import type { DMThread } from "../types";
import { messagesByDMThread } from "./messages/dm-expanded";

/** 自分の最後の発言より後に届いた、相手からの通数（手書き値を持たない） */
const unreadFrom = (list: { authorId: string }[]): number => {
  const lastMine = list.map((message) => message.authorId).lastIndexOf("hal");
  return list.slice(lastMine + 1).filter((message) => message.authorId !== "hal").length;
};

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
    return {
      id,
      urlId,
      participantIds: ["hal", personId] as [string, string],
      lastMessageAt: list[list.length - 1]?.sentAt ?? "2026-11-19T23:52:00+09:00",
      unreadCount: unreadFrom(list),
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
      unreadCount: unreadFrom(list),
    };
  }),
];
