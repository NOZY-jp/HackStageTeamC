import { describe, expect, it } from "vitest";
import { listDMMessages, listDMThreads } from "./index";
import { VOLUME_LIMITS as V } from "./test-thresholds";
import type { Message } from "./types";

const SELF = "hal";
const threads = listDMThreads();
const dmAll = (): Message[] =>
  threads.flatMap((thread) => listDMMessages({ threadId: thread.id, limit: 5000 }).messages);
const all = dmAll();
const byThread = new Map<string, Message[]>(
  threads.map((thread) => [
    thread.id,
    listDMMessages({ threadId: thread.id, limit: 5000 }).messages,
  ]),
);

describe("会話の構造（main から戻した検査）", () => {
  it("未返信で終わるスレッドがある（割合の下限）", () => {
    const unreplied = threads.filter(
      (thread) => byThread.get(thread.id)?.at(-1)?.authorId === SELF,
    );
    expect(unreplied.length / threads.length).toBeGreaterThanOrEqual(V.unrepliedThreadRatioMin);
  });

  it("返信間隔: 1分未満の割合は上限以下で、中央値は現実的な範囲", () => {
    const gaps = [...byThread.values()]
      .flatMap((list) =>
        list.slice(1).map((m, i) => (Date.parse(m.sentAt) - Date.parse(list[i].sentAt)) / 60000),
      )
      .sort((a, b) => a - b);
    expect(gaps.length).toBeGreaterThan(300);
    expect(gaps.filter((gap) => gap < 1).length / gaps.length).toBeLessThanOrEqual(
      V.replyWithinMinuteRatioMax,
    );
    const median = gaps[Math.floor(gaps.length / 2)];
    expect(median).toBeGreaterThanOrEqual(V.replyMedianMinutes.min);
    expect(median).toBeLessThanOrEqual(V.replyMedianMinutes.max);
  });

  it("同じ発言件数の日が長く続かない（8通以上の日だけで数える）", () => {
    const counts = new Map<string, number>();
    for (const message of all) {
      const day = message.sentAt.slice(0, 10);
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
    const busy = [...counts.entries()]
      .filter(([, count]) => count >= 8)
      .sort(([a], [b]) => a.localeCompare(b));
    let streak = 1;
    let max = 1;
    for (let i = 1; i < busy.length; i += 1) {
      streak = busy[i][1] === busy[i - 1][1] ? streak + 1 : 1;
      max = Math.max(max, streak);
    }
    expect(max).toBeLessThanOrEqual(V.maxSameDailyCountStreak);
  });

  it("カイとの DM は月6日まで、MaiMai とは週7日まで", () => {
    const kai = listDMMessages({ threadId: "dm-kai", limit: 5000 }).messages;
    const kaiDays = new Map<string, Set<string>>();
    for (const message of kai) {
      const month = message.sentAt.slice(0, 7);
      const days = kaiDays.get(month) ?? new Set<string>();
      days.add(message.sentAt.slice(0, 10));
      kaiDays.set(month, days);
    }
    for (const [month, days] of kaiDays) {
      expect(days.size, `dm-kai ${month}`).toBeLessThanOrEqual(V.dmKaiMonthlyMax);
    }

    const mai = listDMMessages({ threadId: "dm-maimai", limit: 5000 }).messages;
    const weeks = new Map<string, Set<string>>();
    for (const message of mai) {
      const day = message.sentAt.slice(0, 10);
      const jstDate = new Date(`${day}T00:00:00+09:00`);
      const weekStart = new Date(jstDate.getTime() - jstDate.getUTCDay() * 86_400_000);
      const key = weekStart.toISOString().slice(0, 10);
      const days = weeks.get(key) ?? new Set<string>();
      days.add(day);
      weeks.set(key, days);
    }
    for (const [week, days] of weeks) {
      expect(days.size, `dm-maimai ${week}`).toBeLessThanOrEqual(V.dmMaimaiWeeklyDaysMax);
    }
    expect(mai.length).toBeGreaterThan(0);
  });
});
