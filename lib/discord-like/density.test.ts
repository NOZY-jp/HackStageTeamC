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

  it("相対表現を抽出して日付差と照合する（0件なら fail）", () => {
    const all = [
      ...Object.entries(dmMessages).flatMap(([channelId, list]) =>
        list.map((message) => ({ ...message, channelId })),
      ),
      ...Object.entries(channelMessages).flatMap(([channelId, list]) =>
        list.map((message) => ({ ...message, channelId })),
      ),
    ];
    const found = all.flatMap((message) => relativeIssues(message));
    // 空振り防止: 対象が0件なら fail
    expect(found.length).toBeGreaterThanOrEqual(3);
    expect(found.filter((item) => item.issue)).toEqual([]);
    // 実効性: 数字を書き換えると落ちる（ヘルパー単体で確認）
    const wrong = relativeIssues({
      id: "x",
      channelId: "dm-maimai",
      sentAt: "2026-11-02T21:00:00+09:00",
      body: "あと三週間ちょっと",
    });
    expect(wrong[0]?.issue).toBeTruthy();
  });

  it("増えた分も本文が空でない（写真だけの投稿を除く）", () => {
    const all = [...Object.values(channelMessages).flat(), ...Object.values(dmMessages).flat()];
    const empty = all.filter(
      (message) => message.body.trim() === "" && (message.attachments?.length ?? 0) === 0,
    );
    expect(empty.map((message) => message.id)).toEqual([]);
  });
});

/** 「あと二週間」「三週間切った」「今年あと一日」を、基準日との差と照合する */
type RelativeMessage = { id: string; channelId: string; sentAt: string; body: string };
const KANJI: Record<string, number> = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
  二十: 20,
};
const toNumber = (value: string): number =>
  /^\d+$/.test(value) ? Number(value) : (KANJI[value] ?? Number.NaN);

function relativeIssues(message: RelativeMessage): { id: string; issue?: string }[] {
  const pattern =
    /(あと|まだ)?\s*([一二三四五六七八九十]+|\d+)\s*(日|週間)(以上|ちょっと|切った|ぶり|経った)?/g;
  const issues: { id: string; issue?: string }[] = [];
  for (const match of message.body.matchAll(pattern)) {
    // 未来・経過を表す言い方のときだけ対象にする（「二日測った」等の数量は除く）
    if (!match[1] && !match[4]) continue;
    const amount = toNumber(match[2]);
    if (Number.isNaN(amount)) continue;
    const unit = match[3];
    const target = message.body.includes("今年")
      ? Date.parse(`${message.sentAt.slice(0, 4)}-12-31T00:00:00+09:00`)
      : message.channelId === "dm-maimai"
        ? Date.parse("2026-11-20T13:00:00+09:00")
        : undefined;
    if (target === undefined) {
      issues.push({ id: message.id, issue: `基準日が決まっていない相対表現: ${message.body}` });
      continue;
    }
    const days = Math.round((target - Date.parse(message.sentAt)) / 86_400_000);
    const base = unit === "週間" ? 7 * amount : amount;
    // 「以上」は下限だけ、「ちょっと」は少し上まで許す
    const ok =
      match[4] === "以上"
        ? days >= base
        : match[4] === "ちょっと"
          ? days >= base - 2 && days <= base + 4
          : Math.abs(days - base) <= (unit === "週間" ? 3 : 1);
    if (!ok) {
      issues.push({
        id: message.id,
        issue: `${amount}${unit} と日付差 ${days}日が合わない: ${message.body}`,
      });
    } else {
      issues.push({ id: message.id });
    }
  }
  return issues;
}
