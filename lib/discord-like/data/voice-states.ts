import type { VoiceState } from "../types";

/** 現在ボイスチャンネルにいるメンバー（自分は未接続）。 */
export const voiceStates: VoiceState[] = [
  {
    channelId: "mhc-vc-1",
    userId: "mina",
    joinedAt: "2026-11-19T21:04:00+09:00",
    speaking: true,
  },
  {
    channelId: "mhc-vc-1",
    userId: "haruka",
    joinedAt: "2026-11-19T21:07:00+09:00",
  },
  {
    channelId: "mhc-vc-2",
    userId: "gunlance",
    joinedAt: "2026-11-19T21:12:00+09:00",
    speaking: true,
  },
  {
    channelId: "mhc-vc-2",
    userId: "slime",
    joinedAt: "2026-11-19T21:15:00+09:00",
    muted: true,
  },
];
