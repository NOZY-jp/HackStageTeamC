/**
 * データ品質のガード（#131・決定 D9/D10）。
 * 生成データの「穴」「英語テンプレ」「使い回し」「発言者の逸脱」「日次集中」「時刻衝突」を落とす。
 */
import { describe, expect, it } from "vitest";
import { buildMhcHistory } from "./data/messages/mhc-history";
import { generateDmExpansion } from "./generators/dm-expansion";
import { listChannels, listDMMessages, listDMThreads, listGuilds, listMessages } from "./index";
import { QUALITY_LIMITS as Q } from "./test-thresholds";
import type { Message } from "./types";

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

/**
 * #131/#132 で追加したデータ（ID の接頭辞で判別する）。
 * - mhc の追加分は `mhc-<channel>-h####`
 * - 新サーバーは `univ-*` / `friend-*`
 */
const NEW_ID = /^(mhc-(lfg|chat|questions|clips|gear|notice|intro)-h|univ-|friend-)/;
const newMessages = (): Message[] => messages.filter((message) => NEW_ID.test(message.id));

const messages = allMessages();

describe("データ品質（#131 / D9・D10）", () => {
  it("本文に生成の穴（undefined・null・NaN・{{ }}・TODO）が無い", () => {
    for (const message of messages) {
      expect(message.body, message.id).not.toMatch(/undefined|null|NaN|\{\{|\}\}|TODO|todo\(/);
    }
  });

  it("英語テンプレの定型文が無い（ASCII だけの長い本文を作らない）", () => {
    for (const message of messages) {
      const asciiOnly = /^[\x20-\x7E]+$/.test(message.body);
      const isUrl = /^https?:\/\//.test(message.body);
      const isStamp = /^:[a-z0-9_]+:$/.test(message.body);
      if (asciiOnly && !isUrl && !isStamp) {
        expect(message.body.length, `${message.id}: ${message.body}`).toBeLessThan(8);
      }
    }
  });

  it("新規追加分の本文ユニーク率は95%以上、全体は85%以上（system 行は除く）", () => {
    // 入室/退出のシステム行は仕様上どうしても同じ文言になるため、ユニーク率の分母から除く（D9）
    const isText = (message: Message) => message.system !== true;
    const added = newMessages().filter(isText);
    const texts = messages.filter(isText);
    const addedUnique = new Set(added.map((message) => message.body)).size / added.length;
    const overallUnique = new Set(texts.map((message) => message.body)).size / texts.length;
    expect(addedUnique).toBeGreaterThanOrEqual(Q.newUniqueRate);
    expect(overallUnique).toBeGreaterThanOrEqual(Q.overallUniqueRate);
  });

  it("mhc の発言者は9人まで、kai は mhc と dm-kai 以外で発言せず、mhc では5件まで（D10）", () => {
    let kaiInMhc = 0;
    for (const guild of listGuilds()) {
      if (guild.id !== "mhc") continue;
      for (const channel of listChannels(guild.id).filter((item) => item.kind === "text")) {
        for (const message of listMessages({ channelId: channel.id, limit: 5000 }).messages) {
          expect(Q.mhcSpeakers, `${message.id} ${message.authorId}`).toContain(message.authorId);
          if (message.authorId === "kai") kaiInMhc += 1;
        }
      }
    }
    expect(kaiInMhc).toBeLessThanOrEqual(Q.kaiInMhc);
    for (const message of messages) {
      if (message.authorId === "kai") {
        expect(
          ["mhc", "dm-kai"].some((key) => message.channelId.startsWith(key)),
          message.id,
        ).toBe(true);
      }
    }
  });

  it("サーバーごと・月ごとに10日以上発言があり、6日以降にも発言がある", () => {
    // 全サーバー＋DMの合算ではなく、サーバー単位で日次分散を見る（合算だと薄い月が隠れる）
    for (const guild of listGuilds()) {
      const days = new Map<string, Set<string>>();
      const texts = listChannels(guild.id).filter((channel) => channel.kind === "text");
      for (const channel of texts) {
        for (const message of listMessages({ channelId: channel.id, limit: 5000 }).messages) {
          const month = message.sentAt.slice(0, 7);
          const set = days.get(month) ?? new Set<string>();
          set.add(message.sentAt.slice(0, 10));
          days.set(month, set);
        }
      }
      for (const [month, set] of days) {
        expect(set.size, `${guild.id} ${month}`).toBeGreaterThanOrEqual(Q.minActiveDaysPerMonth);
        const latestDay = Math.max(...[...set].map((day) => Number(day.slice(8, 10))));
        expect(latestDay, `${guild.id} ${month}`).toBeGreaterThanOrEqual(Q.activityAfterDay);
      }
    }
  });

  it("生成器は同じ seed で同じ結果になる（再現性）", () => {
    // 生成時に渡した「既存の時刻」だけで再生成する（生成済みの時刻を混ぜると入力が変わる）
    const isBase = (message: Message) =>
      /^mhc-(lfg|chat|questions|clips|notice)-d{4}$/.test(message.id) ||
      message.channelId.startsWith("dm-");
    const times = [...new Set(messages.filter(isBase).map((message) => message.sentAt))];
    const first = buildMhcHistory(times);
    const second = buildMhcHistory(times);
    expect(second).toEqual(first);
    const current = listGuilds()
      .filter((guild) => guild.id === "mhc")
      .flatMap((guild) => listChannels(guild.id).filter((channel) => channel.kind === "text"))
      .flatMap((channel) => listMessages({ channelId: channel.id, limit: 5000 }).messages)
      .filter((message) => NEW_ID.test(message.id))
      .map(
        (message) => `${message.channelId} ${message.sentAt} ${message.authorId} ${message.body}`,
      );
    const generated = Object.values(first)
      .flat()
      .map(
        (message) => `${message.channelId} ${message.sentAt} ${message.authorId} ${message.body}`,
      );
    expect(generated.length).toBe(current.length);
    expect([...generated].sort()).toEqual([...current].sort());
  });

  it("sentAt はサーバー・DM をまたいで一意", () => {
    const seen = new Set<string>();
    for (const message of messages) {
      expect(seen.has(message.sentAt), `${message.id} ${message.sentAt}`).toBe(false);
      seen.add(message.sentAt);
    }
  });

  it("#133: 恋人の DM は各月2日以上は会話せず、連続して空くのは3日まで", () => {
    const list = listDMMessages({ threadId: "dm-maimai", limit: 5000 }).messages;
    const days = new Set(list.map((message) => message.sentAt.slice(0, 10)));
    for (const month of [
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
    ]) {
      const [year, monthNumber] = month.split("-").map(Number);
      const total = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
      let silent = 0;
      let run = 0;
      let maxRun = 0;
      for (let day = 1; day <= total; day += 1) {
        const key = `${month}-${String(day).padStart(2, "0")}`;
        if (days.has(key)) {
          run = 0;
          continue;
        }
        silent += 1;
        run += 1;
        maxRun = Math.max(maxRun, run);
      }
      expect(silent, month).toBeGreaterThanOrEqual(2);
      expect(maxRun, month).toBeLessThanOrEqual(3);
    }
  });

  it("#133: 通話は34回・不在着信6回で、開始と終了が対になっている", () => {
    const list = listDMMessages({ threadId: "dm-maimai", limit: 5000 }).messages;
    const starts = list.filter((message) => message.body.includes("通話を開始しました"));
    const ends = list.filter((message) => message.body.includes("通話を終了しました"));
    const missed = list.filter((message) => message.body.includes("応答がありませんでした"));
    expect(starts.length).toBe(34);
    expect(starts.length).toBe(ends.length + missed.length);
    expect(missed.length).toBe(6);
  });

  it("#133: 2026-08 にぶつかって謝っている", () => {
    const list = listDMMessages({ threadId: "dm-maimai", limit: 5000 }).messages.filter(
      (message) => message.sentAt.slice(0, 7) === "2026-08",
    );
    expect(list.some((message) => message.body.includes("傷ついた"))).toBe(true);
    expect(list.some((message) => message.body.includes("ごめん"))).toBe(true);
  });

  it("#133: DM 追加分も本文ユニーク率95%以上で、同じ seed なら同じ結果", () => {
    const added = listDMThreads()
      .flatMap((thread) => listDMMessages({ threadId: thread.id, limit: 5000 }).messages)
      .filter((message) => message.id.includes("-x") && message.system !== true);
    const unique = new Set(added.map((message) => message.body)).size / added.length;
    expect(unique).toBeGreaterThanOrEqual(Q.newUniqueRate);
    const times = messages
      .filter((message) => !message.id.includes("-x"))
      .map((message) => message.sentAt);
    const maimaiDays = listDMMessages({ threadId: "dm-maimai", limit: 5000 })
      .messages.filter((message) => !message.id.includes("-x"))
      .map((message) => message.sentAt.slice(0, 10));
    const first = generateDmExpansion({
      existingTimes: times,
      existingMaimaiDays: maimaiDays,
      existingCallStarts: 0,
      existingLastMaimaiAt: "2026-11-19T21:48:00+09:00",
    });
    const second = generateDmExpansion({
      existingTimes: times,
      existingMaimaiDays: maimaiDays,
      existingCallStarts: 0,
      existingLastMaimaiAt: "2026-11-19T21:48:00+09:00",
    });
    expect(second.additions).toEqual(first.additions);
  });

  it("voice チャンネルには入室/退出のシステムメッセージしか無い（#129 で VoiceSession を追加）", () => {
    for (const guild of listGuilds()) {
      for (const channel of listChannels(guild.id).filter((item) => item.kind === "voice")) {
        for (const message of listMessages({ channelId: channel.id, limit: 500 }).messages) {
          expect(message.system, message.id).toBe(true);
        }
      }
    }
  });
});
