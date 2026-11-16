import type { VoiceState } from "../types";

/** ボイスチャンネルの参加者。空のVCも含む。 */
export const voiceStates: VoiceState[] = [
  {
    channelId: "s1-vc-1",
    userId: "u4",
    joinedAt: "2026-11-05T10:07:00.000Z",
    speaking: true,
  },
  {
    channelId: "s1-vc-1",
    userId: "u5",
    joinedAt: "2026-11-05T10:10:00.000Z",
  },
  {
    channelId: "s1-vc-3",
    userId: "u10",
    joinedAt: "2026-11-05T10:21:00.000Z",
    speaking: true,
  },
  {
    channelId: "s1-vc-3",
    userId: "u11",
    joinedAt: "2026-11-05T10:24:00.000Z",
  },
  {
    channelId: "s1-vc-3",
    userId: "u12",
    joinedAt: "2026-11-05T10:27:00.000Z",
    muted: true,
  },
  {
    channelId: "s2-vc-1",
    userId: "u13",
    joinedAt: "2026-11-05T10:28:00.000Z",
    speaking: true,
  },
  {
    channelId: "s2-vc-2",
    userId: "u16",
    joinedAt: "2026-11-05T10:35:00.000Z",
    speaking: true,
  },
  {
    channelId: "s2-vc-2",
    userId: "u17",
    joinedAt: "2026-11-05T10:38:00.000Z",
  },
  {
    channelId: "s2-vc-2",
    userId: "u18",
    joinedAt: "2026-11-05T10:41:00.000Z",
    muted: true,
  },
  {
    channelId: "s2-vc-2",
    userId: "u19",
    joinedAt: "2026-11-05T10:44:00.000Z",
    deafened: true,
  },
  {
    channelId: "s3-vc-2",
    userId: "u22",
    joinedAt: "2026-11-05T10:49:00.000Z",
    speaking: true,
  },
  {
    channelId: "s3-vc-2",
    userId: "u23",
    joinedAt: "2026-11-05T10:52:00.000Z",
  },
  {
    channelId: "s3-vc-3",
    userId: "u25",
    joinedAt: "2026-11-05T10:56:00.000Z",
    speaking: true,
  },
];
