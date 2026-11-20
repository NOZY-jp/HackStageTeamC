/**
 * データ品質のガード（#131・決定 D9/D10）。
 * 生成データの「穴」「英語テンプレ」「使い回し」「発言者の逸脱」「日次集中」「時刻衝突」を落とす。
 */
import { describe, expect, it } from "vitest";
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
const NEW_ID = /^(mhc-(lfg|chat|questions|clips|gear|notice|intro|ochiba)-h|univ-|friend-)/;
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

  it("新規追加分の本文ユニーク率は95%以上、全体は85%以上", () => {
    const added = newMessages();
    const addedUnique = new Set(added.map((message) => message.body)).size / added.length;
    const overallUnique = new Set(messages.map((message) => message.body)).size / messages.length;
    expect(addedUnique).toBeGreaterThanOrEqual(Q.newUniqueRate);
    expect(overallUnique).toBeGreaterThanOrEqual(Q.overallUniqueRate);
  });

  it("mhc の発言者は9人まで、kai は mhc と dm-kai 以外で発言しない", () => {
    for (const guild of listGuilds()) {
      if (guild.id !== "mhc") continue;
      for (const channel of listChannels(guild.id).filter((item) => item.kind === "text")) {
        for (const message of listMessages({ channelId: channel.id, limit: 5000 }).messages) {
          expect(Q.mhcSpeakers, `${message.id} ${message.authorId}`).toContain(message.authorId);
        }
      }
    }
    for (const message of messages) {
      if (message.authorId === "kai") {
        expect(
          ["mhc", "dm-kai"].some((key) => message.channelId.startsWith(key)),
          message.id,
        ).toBe(true);
      }
    }
  });

  it("各月で10日以上発言があり、6日以降にも発言がある", () => {
    const byMonth = new Map<string, Set<string>>();
    for (const message of messages) {
      const month = message.sentAt.slice(0, 7);
      const days = byMonth.get(month) ?? new Set<string>();
      days.add(message.sentAt.slice(0, 10));
      byMonth.set(month, days);
    }
    expect(byMonth.size).toBeGreaterThanOrEqual(12);
    for (const [month, days] of byMonth) {
      expect(days.size, month).toBeGreaterThanOrEqual(Q.minActiveDaysPerMonth);
      const latestDay = Math.max(...[...days].map((day) => Number(day.slice(8, 10))));
      expect(latestDay, month).toBeGreaterThanOrEqual(Q.activityAfterDay);
    }
  });

  it("sentAt はサーバー・DM をまたいで一意", () => {
    const seen = new Set<string>();
    for (const message of messages) {
      expect(seen.has(message.sentAt), `${message.id} ${message.sentAt}`).toBe(false);
      seen.add(message.sentAt);
    }
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
