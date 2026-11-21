import { describe, expect, it } from "vitest";
import type { Message } from "@/lib/discord-like/types";
import { latestConversation, threadPreview } from "./dm-preview";

/**
 * #217: DM一覧のプレビュー・時刻は、物語の新着で更新される。
 * 通話の開始・終了のシステム行では上書きしない（データから導出する）。
 */

const message = (sentAt: string, body: string, system = false): Message => ({
  id: `m-${sentAt}`,
  channelId: "dm-kai",
  authorId: "kai",
  sentAt,
  body,
  ...(system ? { system: true } : {}),
});

describe("DM一覧のプレビュー（#217）", () => {
  it("新しい会話があればプレビューと時刻が更新される", () => {
    const base = { sentAt: "2026-11-23T21:11:00+09:00", preview: "今の進捗どう？", time: "21:11" };
    const live = [message("2026-11-24T22:30:00+09:00", "住所は特定できた？")];
    expect(threadPreview(base, live)).toEqual({ preview: "住所は特定できた？", time: "22:30" });
  });

  it("古いメッセージや同時刻では更新しない", () => {
    const base = { sentAt: "2026-11-24T22:30:00+09:00", preview: "今の進捗どう？", time: "22:30" };
    expect(threadPreview(base, [message("2026-11-24T22:00:00+09:00", "前の話")])).toEqual({
      preview: "今の進捗どう？",
      time: "22:30",
    });
  });

  it("通話の開始・終了のシステム行では上書きしない", () => {
    const live = [
      message("2026-11-24T22:30:00+09:00", "通話を開始しました", true),
      message("2026-11-24T22:31:00+09:00", "通話を終了しました", true),
      message("2026-11-24T22:32:00+09:00", "応答がありませんでした", true),
    ];
    expect(latestConversation(live)).toBeUndefined();
  });
});
