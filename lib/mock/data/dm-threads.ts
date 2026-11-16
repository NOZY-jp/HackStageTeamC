import type { DMThread } from "../types";

/** DM スレッド5件。lastMessageAt は各スレッドの最終メッセージと同じ固定値。 */
export const dmThreads: DMThread[] = [
  {
    id: "t1",
    participantIds: ["u1", "u2"],
    lastMessageAt: "2026-11-03T11:48:00.000Z",
    unreadCount: 1,
  },
  {
    id: "t2",
    participantIds: ["u3", "u4"],
    lastMessageAt: "2026-11-04T13:12:00.000Z",
    unreadCount: 2,
  },
  {
    id: "t3",
    participantIds: ["u6", "u7"],
    lastMessageAt: "2026-11-05T12:30:00.000Z",
  },
  {
    id: "t4",
    participantIds: ["u8", "u9"],
    lastMessageAt: "2026-11-06T14:51:00.000Z",
  },
  {
    id: "t5",
    participantIds: ["u10", "u11"],
    lastMessageAt: "2026-11-07T16:30:00.000Z",
  },
];
