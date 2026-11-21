/**
 * 会話の自然さ（#130）。
 * しきい値は `test-thresholds.ts` の定数だけを見る。データを増やす PR（#131〜#133）では、
 * **定数を目標値へ上げるだけ**で検証が強くなる（このテストは書き換えない）。
 */
import { describe, expect, it } from "vitest";
import { MAIMAI_NAME } from "./data/names";
import { listChannels, listDMMessages, listDMThreads, listGuilds, listMessages } from "./index";
import { NATURALNESS_LIMITS as L } from "./test-thresholds";
import type { Message } from "./types";

const SELF = "hal";
const MINUTE = 60 * 1000;

/** 全サーバー（#132 で増えても自動で対象になる）と全 DM のメッセージ。 */
const allMessages = (): Message[] => {
  const server = listGuilds().flatMap((guild) =>
    listChannels(guild.id)
      .filter((channel) => channel.kind === "text")
      .flatMap((channel) => listMessages({ channelId: channel.id, limit: 5000 }).messages),
  );
  const dm = listDMThreads().flatMap(
    (thread) => listDMMessages({ threadId: thread.id, limit: 5000 }).messages,
  );
  return [...server, ...dm];
};

/** スレッド（チャンネル・DM）ごとに分ける。 */
const byContainer = (messages: Message[]): Map<string, Message[]> => {
  const groups = new Map<string, Message[]>();
  for (const message of messages) {
    const list = groups.get(message.channelId) ?? [];
    list.push(message);
    groups.set(message.channelId, list);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  }
  return groups;
};

const minutesBetween = (a: Message, b: Message) =>
  (Date.parse(b.sentAt) - Date.parse(a.sentAt)) / MINUTE;

/** 質問（？で終わる）のあと、返事が無いまま同じ人が続けた回数（既読スルー）。 */
function readThroughCount(groups: Map<string, Message[]>): number {
  let count = 0;
  for (const messages of groups.values()) {
    for (let i = 0; i < messages.length - 1; i += 1) {
      const asked = /[?？]$/.test(messages[i].body.trim());
      if (asked && messages[i + 1].authorId === messages[i].authorId) {
        count += 1;
      }
    }
  }
  return count;
}

/** 5分以内の同じ人の続き（連投）。 */
function consecutivePosts(groups: Map<string, Message[]>): number {
  let count = 0;
  for (const messages of groups.values()) {
    for (let i = 1; i < messages.length; i += 1) {
      const same = messages[i].authorId === messages[i - 1].authorId;
      if (same && minutesBetween(messages[i - 1], messages[i]) <= 5) {
        count += 1;
      }
    }
  }
  return count;
}

/** 相手が変わるところの返信間隔（分）。 */
function replyGaps(groups: Map<string, Message[]>): number[] {
  const gaps: number[] = [];
  for (const messages of groups.values()) {
    for (let i = 1; i < messages.length; i += 1) {
      // 除外はしない（12時間超もそのまま数える。夜をまたぐ返信も実際の間隔）
      if (messages[i].authorId !== messages[i - 1].authorId) {
        gaps.push(minutesBetween(messages[i - 1], messages[i]));
      }
    }
  }
  return gaps.sort((a, b) => a - b);
}

/**
 * 通話の開始/終了の対応（不在着信は「終了」として数える）。
 * #129 で `VoiceSession` が入ったら、この関数の中だけを差し替える。
 */
function callSessions(messages: Message[]): { starts: number; ends: number } {
  const calls = messages.filter(
    (message) => message.body.includes("通話を開始") || message.body.includes("通話を終了"),
  );
  const missed = messages.filter((message) => message.body.includes("応答がありませんでした"));
  return {
    starts: calls.filter((message) => message.body.includes("通話を開始")).length,
    ends: calls.filter((message) => message.body.includes("通話を終了")).length + missed.length,
  };
}

const messages = allMessages();
const groups = byContainer(messages);

describe("会話の自然さ（#130）", () => {
  it("未返信で終わるスレッドがある（割合の下限）", () => {
    const threads = listDMThreads();
    const unreplied = threads.filter((thread) => {
      const list = listDMMessages({ threadId: thread.id, limit: 5000 }).messages;
      const last = list[list.length - 1];
      return last?.authorId === SELF;
    });
    expect(unreplied.length / threads.length).toBeGreaterThanOrEqual(L.unrepliedThreadRatio);
  });

  it("既読スルー・連投・話題の中断がしきい値以上ある", () => {
    expect(readThroughCount(groups)).toBeGreaterThanOrEqual(L.readThrough);
    expect(consecutivePosts(groups)).toBeGreaterThanOrEqual(L.consecutivePosts);
    const topicBreaks = messages.filter((message) =>
      /^(あ、|そういえば|ところで|あのさ|ちなみに)/.test(message.body.trim()),
    );
    expect(topicBreaks.length).toBeGreaterThanOrEqual(L.topicBreaks);
  });

  it("誤字・言い直し・スタンプのみ・画像/リンクのみがしきい値以上ある", () => {
    const typo = messages.filter((message) => /誤字|言い直|いや、|間違えた/.test(message.body));
    const stamps = messages.filter((message) => /^:[a-z0-9_]+:$/.test(message.body.trim()));
    const mediaOnly = messages.filter((message) =>
      (message.attachments?.length ?? 0) > 0
        ? message.body.trim().length === 0
        : /^https?:\/\/\S+$/.test(message.body.trim()),
    );
    expect(typo.length).toBeGreaterThanOrEqual(L.typoOrRetraction);
    expect(stamps.length).toBeGreaterThanOrEqual(L.stampsOnly);
    expect(mediaOnly.length).toBeGreaterThanOrEqual(L.mediaOnly);
  });

  it("返信間隔: 1分未満の割合は上限以下で、中央値は現実的な範囲", () => {
    const gaps = replyGaps(groups);
    expect(gaps.length).toBeGreaterThan(100);
    const underOneMinute = gaps.filter((gap) => gap < 1).length / gaps.length;
    expect(underOneMinute).toBeLessThanOrEqual(L.replyWithinMinuteRatioMax);
    const median = gaps[Math.floor(gaps.length / 2)];
    expect(median).toBeGreaterThanOrEqual(L.replyMedianMinutes.min);
    expect(median).toBeLessThanOrEqual(L.replyMedianMinutes.max);
  });

  it("同じ発言件数の日が長く続かない（8通以上の日だけで数える）", () => {
    // 1〜7通の薄い日は偶然同じ件数になりやすい。会話が濃い日の設計が単調でないかを見る。
    const counts = new Map<string, number>();
    for (const message of messages) {
      const day = message.sentAt.slice(0, 10);
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
    const busy = [...counts.entries()].filter(([, count]) => count >= 8);
    let streak = 1;
    let max = 1;
    for (let i = 1; i < busy.length; i += 1) {
      streak = busy[i][1] === busy[i - 1][1] ? streak + 1 : 1;
      max = Math.max(max, streak);
    }
    expect(max).toBeLessThanOrEqual(L.maxSameDailyCountStreak);
  });

  it("通話の開始と終了が対になっている（不在着信は終了として数える）", () => {
    const { starts, ends } = callSessions(messages);
    expect(starts).toBeGreaterThan(0);
    expect(Math.abs(starts - ends)).toBeLessThanOrEqual(L.callPairTolerance);
  });

  it("各通話は1分〜6時間で、スレッド単位でも開始と終了が対になっている", () => {
    const byThread = byContainer(
      messages.filter(
        (message) =>
          message.body.includes("通話を開始") ||
          message.body.includes("通話を終了") ||
          message.body.includes("応答がありませんでした"),
      ),
    );
    expect(byThread.size).toBeGreaterThan(0);
    for (const [thread, list] of byThread) {
      let open: Message | undefined;
      for (const message of list) {
        if (message.body.includes("通話を開始")) {
          // 開始の連続は浮き（前の通話が終わっていない）
          expect(open, `${thread}: 開始が連続`).toBeUndefined();
          open = message;
          continue;
        }
        // 終了・不在着信は開始と対でだけ現れる
        if (!open) {
          throw new Error(`${thread}: 開始なしの終了 ${message.id}`);
        }
        const minutes = (Date.parse(message.sentAt) - Date.parse(open.sentAt)) / 60000;
        expect(minutes, `${thread}: 通話の長さ`).toBeGreaterThanOrEqual(1);
        expect(minutes, `${thread}: 通話の長さ`).toBeLessThanOrEqual(6 * 60);
        open = undefined;
      }
      expect(open, `${thread}: 開始だけで終了が無い`).toBeUndefined();
    }
  });

  it("時刻はすべて +09:00 固定（タイムゾーンの混在を許さない）", () => {
    for (const message of messages) {
      expect(message.sentAt, message.id).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\+09:00$/);
    }
  });

  it("通話は夜〜深夜に始まり、早朝（4〜7時）には始まらない", () => {
    const starts = messages.filter((message) => message.body.includes("通話を開始しました"));
    expect(starts.length).toBeGreaterThan(0);
    const hours = starts.map((message) => Number(message.sentAt.slice(11, 13)));
    // 19時〜翌2時のあいだに大半が始まる
    const evening = hours.filter((hour) => hour >= 19 || hour <= 2);
    expect(evening.length / hours.length).toBeGreaterThanOrEqual(0.5);
    // 早朝 4〜7 時には始めない
    expect(hours.some((hour) => hour >= 4 && hour <= 7)).toBe(false);
  });

  it("未返信・既読スルーはスレッド単位でも数えられる", () => {
    const threads = listDMThreads();
    expect(threads.length).toBeGreaterThan(0);
    const perThread = threads.map((thread) => {
      const list = listDMMessages({ threadId: thread.id, limit: 5000 }).messages;
      const groups = byContainer(list);
      return {
        id: thread.id,
        unreplied: list[list.length - 1]?.authorId === SELF,
        readThrough: readThroughCount(groups),
      };
    });
    // どこかのスレッドに、未返信か既読スルーのどちらかがある
    expect(perThread.some((entry) => entry.unreplied || entry.readThrough > 0)).toBe(true);
  });

  it("関係性ごとの頻度の上限", () => {
    // カイとの DM（依頼主）は月6回まで
    // 「回」＝会話の機会（日）。通数ではなく、月あたりの発言日数で見る
    const kai = listDMMessages({ threadId: "dm-kai", limit: 5000 }).messages;
    const daysPerMonth = new Map<string, Set<string>>();
    for (const message of kai) {
      const month = message.sentAt.slice(0, 7);
      const days = daysPerMonth.get(month) ?? new Set<string>();
      days.add(message.sentAt.slice(0, 10));
      daysPerMonth.set(month, days);
    }
    for (const [month, days] of daysPerMonth) {
      expect(days.size, `dm-kai ${month}`).toBeLessThanOrEqual(L.dmKaiMonthlyMax);
    }

    // MaiMai との DM は週7日を超えない（週ごとに数える）
    const mai = listDMMessages({ threadId: "dm-maimai", limit: 5000 }).messages;
    // 週の区切りは日本時間（+09:00）で計算する（ローカルTZやUTCに依存させない）
    const weeks = new Map<string, Set<string>>();
    for (const message of mai) {
      const day = message.sentAt.slice(0, 10);
      const jstDate = new Date(`${day}T00:00:00+09:00`);
      const weekday = jstDate.getUTCDay();
      const weekStart = new Date(jstDate.getTime() - weekday * 86_400_000);
      const key = weekStart.toISOString().slice(0, 10);
      const days = weeks.get(key) ?? new Set<string>();
      days.add(day);
      weeks.set(key, days);
    }
    for (const [week, days] of weeks) {
      expect(days.size, `dm-maimai ${week}`).toBeLessThanOrEqual(L.dmMaimaiWeeklyDaysMax);
    }
    expect(mai.length).toBeGreaterThan(0);
  });

  it("呼び方の固定: 本名由来の呼び方が作中テキストに0件", () => {
    // 検査する語そのものをリポジトリに残さない（文字コードで組み立てる）
    const word = (...codePoints: number[]) => String.fromCodePoint(...codePoints);
    const forbidden = [word(0x3086, 0x3044), word(0x3086, 0x3063, 0x3061, 0x3083, 0x3093)];
    for (const message of messages) {
      for (const term of forbidden) {
        expect(message.body, message.id).not.toContain(term);
      }
    }
    // MaiMai との DM では互いを表示名で呼び、本名（名字・名前）は出さない
    const mai = listDMMessages({ threadId: "dm-maimai", limit: 5000 }).messages;
    expect(mai.some((message) => message.body.includes(MAIMAI_NAME))).toBe(true);
    for (const message of mai) {
      expect(message.body).not.toContain(word(0x670d, 0x90e8));
      expect(message.body).not.toContain(word(0x7531, 0x6bd4));
    }
  });
});
