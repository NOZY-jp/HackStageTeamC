import type { DMThread } from "../types";

/** DM スレッドは1つ（#5 で増やす）。 */
export const dmThreads: DMThread[] = [
  {
    id: "t1",
    participantIds: ["u1", "u2"],
    lastMessageAt: "2026-11-16T12:05:00.000Z",
    unreadCount: 1,
  },
];
