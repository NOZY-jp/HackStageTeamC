import type { DMThread } from "../types";

/** DM スレッドは MaiMai との1件のみ。lastMessageAt は最終メッセージと同じ固定値。 */
export const dmThreads: DMThread[] = [
  {
    id: "dm-maimai",
    urlId: "1187002356428841501",
    participantIds: ["hal", "maimai"],
    lastMessageAt: "2026-11-19T21:48:00+09:00",
    unreadCount: 2,
  },
];
