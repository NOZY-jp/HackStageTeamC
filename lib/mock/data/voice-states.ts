import type { VoiceState } from "../types";

/** ボイスチャンネル v1 に2人が接続中。 */
export const voiceStates: VoiceState[] = [
  {
    channelId: "v1",
    userId: "u3",
    speaking: true,
    joinedAt: "2026-11-16T09:30:00.000Z",
  },
  {
    channelId: "v1",
    userId: "u4",
    muted: true,
    joinedAt: "2026-11-16T09:41:00.000Z",
  },
];
