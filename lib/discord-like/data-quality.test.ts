/**
 * データ品質のガード（#131・決定 D9/D10）。
 * 生成データの「穴」「英語テンプレ」「使い回し」「発言者の逸脱」「日次集中」「時刻衝突」を落とす。
 * 数字・記号で一意に見せた文（水増し）も許さない。
 */
import { describe, expect, it } from "vitest";
import { buildMhcHistory } from "./data/messages/mhc-history";
import {
  KAI_LIMIT_IN_MHC,
  looksMechanical,
  looksTwoTopic,
  PERSON_FORBIDDEN,
} from "./generators/mhc-history";
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

/** #131 で追加した mhc の履歴（`mhc-<channel>-h####`） */
const NEW_ID = /^mhc-(lfg|chat|questions|clips|gear|notice|intro)-h\d{4}$/;
const messages = allMessages();
const newMessages = (): Message[] => messages.filter((message) => NEW_ID.test(message.id));

/** 数字・記号で一意に見せた水増し文か（URL は除く） */
const looksPadded = (body: string): boolean => {
  if (/https?:\/\//.test(body)) return false;
  return /[（(]\s*\d{1,4}\s*[)）]\s*$/.test(body) || /\d{3,}\s*$/.test(body);
};

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

  it("数字・記号で一意に見せた水増し文が無い", () => {
    for (const message of messages) {
      expect(looksPadded(message.body), `${message.id}: ${message.body}`).toBe(false);
    }
  });

  it("文末に「時刻＋モンスター名」を機械的に足した文が無い", () => {
    for (const message of messages) {
      expect(looksMechanical(message.body), `${message.id}: ${message.body}`).toBe(false);
    }
  });

  it("1文に2つの話題（時刻＋別の話題）を連結しない", () => {
    for (const message of messages) {
      expect(looksTwoTopic(message.body), `${message.id}: ${message.body}`).toBe(false);
    }
  });

  it("「〜の件／〜の話」の継ぎはぎで水増ししない", () => {
    for (const message of messages) {
      expect(
        /(の件|の話)[、。].*(の件|の話)/.test(message.body),
        `${message.id}: ${message.body}`,
      ).toBe(false);
    }
  });

  it("新規追加分の本文ユニーク率は95%以上、全体は85%以上（system 行は除く）", () => {
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
    for (const channel of listChannels("mhc").filter((item) => item.kind === "text")) {
      for (const message of listMessages({ channelId: channel.id, limit: 5000 }).messages) {
        expect(Q.mhcSpeakers, `${message.id} ${message.authorId}`).toContain(message.authorId);
        if (message.authorId === "kai") kaiInMhc += 1;
      }
    }
    expect(kaiInMhc).toBeLessThanOrEqual(KAI_LIMIT_IN_MHC);
    for (const message of messages) {
      if (message.authorId !== "kai") continue;
      expect(
        ["mhc", "dm-kai"].some((key) => message.channelId.startsWith(key)),
        message.id,
      ).toBe(true);
    }
  });

  it("学生でない人（MaiMai・じじい・マスター）は学生語彙を使わない（0件）", () => {
    // 既存メッセージは書き換えない（D9）。新規追加分だけを検査する
    for (const message of newMessages()) {
      const rule = PERSON_FORBIDDEN[message.authorId];
      if (!rule) continue;
      expect(rule.test(message.body), `${message.id} ${message.authorId}: ${message.body}`).toBe(
        false,
      );
    }
  });

  it("mhc は各月10日以上発言があり、6日以降にも発言がある", () => {
    const byMonth = new Map<string, Set<string>>();
    for (const channel of listChannels("mhc").filter((item) => item.kind === "text")) {
      for (const message of listMessages({ channelId: channel.id, limit: 5000 }).messages) {
        const month = message.sentAt.slice(0, 7);
        const days = byMonth.get(month) ?? new Set<string>();
        days.add(message.sentAt.slice(0, 10));
        byMonth.set(month, days);
      }
    }
    expect(byMonth.size).toBeGreaterThanOrEqual(12);
    for (const [month, days] of byMonth) {
      expect(days.size, month).toBeGreaterThanOrEqual(Q.minActiveDaysPerMonth);
      const latestDay = Math.max(...[...days].map((day) => Number(day.slice(8, 10))));
      expect(latestDay, month).toBeGreaterThanOrEqual(Q.activityAfterDay);
    }
  });

  it("sentAt はサーバー・DM をまたいで一意（既存由来の重複だけ例外）", () => {
    // D9: 既存メッセージの時刻は書き換えない。既存同士の重複だけを明示的に除外する。
    const EXISTING_DUPLICATES = new Set([
      "2025-05-10T15:53:00+09:00", // mhc-chat-0046 × 0047（既存）
      "2026-09-02T21:12:00+09:00", // dm-maimai-0178 × 0179（既存）
      "2026-09-09T23:21:00+09:00", // dm-maimai-0201 × 0202（既存）
      "2026-10-26T22:16:00+09:00", // dm-maimai-0346 × 0347（既存）
      "2026-11-10T23:21:00+09:00", // mhc-chat-0221 × dm-maimai-0397（既存）
    ]);
    const seen = new Set<string>();
    for (const message of messages) {
      if (EXISTING_DUPLICATES.has(message.sentAt)) continue;
      expect(seen.has(message.sentAt), `${message.id} ${message.sentAt}`).toBe(false);
      seen.add(message.sentAt);
    }
  });

  it("生成器は同じ seed で同じ結果になる（再現性）", () => {
    const isBase = (message: Message) =>
      /^mhc-(lfg|chat|questions|clips|notice)-\d{4}$/.test(message.id) ||
      message.channelId.startsWith("dm-");
    const times = [...new Set(messages.filter(isBase).map((message) => message.sentAt))];
    const first = buildMhcHistory(times);
    const second = buildMhcHistory(times);
    expect(second).toEqual(first);
    const current = listChannels("mhc")
      .filter((channel) => channel.kind === "text")
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
