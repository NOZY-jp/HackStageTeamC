import { describe, expect, it } from "vitest";
import { channelMessages, dmMessages } from "./data/messages";
import { listDMMessages, listDMThreads, listVoiceSessions } from "./index";

const dm = (threadId: string) => listDMMessages({ threadId, limit: 6000 }).messages;

describe("台本の密度（#177）", () => {
  it("dm-maimai の通話は14回・不在4回で、夜〜深夜にだけ始まる", () => {
    const sessions = listVoiceSessions({ scope: "dm", channelId: "dm-maimai" });
    expect(sessions).toHaveLength(14);
    expect(sessions.filter((session) => session.endedReason === "missed")).toHaveLength(4);
    const starts = dm("dm-maimai").filter(
      (message) => message.system === true && message.body.includes("通話を開始しました"),
    );
    expect(starts).toHaveLength(14);
    for (const start of starts) {
      const hour = Number(start.sentAt.slice(11, 13));
      expect(hour >= 19 || hour <= 2, start.id).toBe(true);
      expect(hour >= 4 && hour <= 6, start.id).toBe(false);
    }
  });

  it("季節イベントが実際の日付にある（夏祭り=8月・年越し=12/31・アプデ記念）", () => {
    const mhc = Object.entries(channelMessages)
      .filter(([channelId]) => channelId.startsWith("mhc-"))
      .flatMap(([, list]) => list);
    const on = (day: string) => mhc.filter((message) => message.sentAt.startsWith(day));
    expect(on("2026-08-08").length).toBeGreaterThan(5);
    expect(on("2025-12-31").length).toBeGreaterThan(3);
    expect(on("2025-12-13").length).toBeGreaterThan(3);
    expect(on("2026-03-14").length).toBeGreaterThan(3);
    // 夏祭りは8月だけ（別の月に夏祭りを置かない）
    const summer = mhc.filter((message) => message.body.includes("夏祭り"));
    expect(summer.every((message) => message.sentAt.slice(5, 7) === "08")).toBe(true);
    // 年越しは12/31だけ
    const newYear = mhc.filter((message) => message.body.includes("年越し"));
    expect(newYear.every((message) => message.sentAt.slice(5, 10) === "12-31")).toBe(true);
  });

  it("unreadCount と lastMessageAt はメッセージから自動計算した値と一致する", () => {
    for (const thread of listDMThreads()) {
      const list = dm(thread.id);
      const lastMine = list.map((message) => message.authorId).lastIndexOf("hal");
      const expectedUnread = list
        .slice(lastMine + 1)
        .filter((message) => message.authorId !== "hal").length;
      expect(thread.lastMessageAt, thread.id).toBe(list[list.length - 1]?.sentAt);
      expect(thread.unreadCount, thread.id).toBe(expectedUnread);
    }
  });

  it("相対表現が日付差と合っている（二週間・三週間・二十日）", () => {
    const meeting = Date.parse("2026-11-20T13:00:00+09:00");
    const relative = dm("dm-maimai").filter((message) => /週間|二十日/.test(message.body));
    expect(relative.length).toBeGreaterThan(0);
    for (const message of relative) {
      const days = Math.round((meeting - Date.parse(message.sentAt)) / 86_400_000);
      if (message.body.includes("二週間")) {
        expect(days, message.id).toBeGreaterThanOrEqual(13);
        expect(days, message.id).toBeLessThanOrEqual(21);
      }
      if (message.body.includes("三週間")) {
        expect(days, message.id).toBeGreaterThanOrEqual(19);
        expect(days, message.id).toBeLessThanOrEqual(23);
      }
      expect(message.body, message.id).not.toContain("二十日");
    }
  });

  it("増えた分も本文が空でない（写真だけの投稿を除く）", () => {
    const all = [...Object.values(channelMessages).flat(), ...Object.values(dmMessages).flat()];
    const empty = all.filter(
      (message) => message.body.trim() === "" && (message.attachments?.length ?? 0) === 0,
    );
    expect(empty.map((message) => message.id)).toEqual([]);
  });
});
