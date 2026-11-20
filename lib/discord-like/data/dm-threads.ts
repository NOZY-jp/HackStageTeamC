import type { DMThread } from "../types";

/**
 * DM スレッド。lastMessageAt は最終メッセージと同じ固定値。
 * カイとの DM は、調査の進捗（結末を含む）を公開チャンネルに出さないための非公開の場（#121）。
 */
export const dmThreads: DMThread[] = [
  {
    id: "dm-maimai",
    urlId: "1187002356428841501",
    participantIds: ["hal", "maimai"],
    lastMessageAt: "2026-11-19T21:48:00+09:00",
    unreadCount: 2,
  },
  {
    id: "dm-kai",
    urlId: "1187002356428841502",
    participantIds: ["hal", "kai"],
    lastMessageAt: "2026-11-19T23:52:00+09:00",
    unreadCount: 0,
  },
];
