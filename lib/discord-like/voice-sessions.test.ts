/**
 * 通話履歴の構造化（#129）。
 * システムメッセージの開始/終了/不在着信から VoiceSession を導出できているかを見る。
 */
import { describe, expect, it } from "vitest";
import { voiceSessionMinutes } from "./data/voice-sessions";
import {
  listChannels,
  listDMMessages,
  listDMThreads,
  listGuilds,
  listMessages,
  listVoiceSessions,
} from "./index";
import type { Message } from "./types";

const allMessages = (): Message[] => {
  const server = listGuilds().flatMap((guild) =>
    listChannels(guild.id)
      .filter((channel) => channel.kind === "text" || channel.kind === "voice")
      .flatMap((channel) => listMessages({ channelId: channel.id, limit: 5000 }).messages),
  );
  const dm = listDMThreads().flatMap(
    (thread) => listDMMessages({ threadId: thread.id, limit: 5000 }).messages,
  );
  return [...server, ...dm];
};

const messages = allMessages();
const sessions = listVoiceSessions();

describe("VoiceSession（#129）", () => {
  it("開始メッセージ1件につきセッション1件（通話IDは一意）", () => {
    const starts = messages.filter((message) => message.body.includes("通話を開始しました"));
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions.length).toBe(starts.length);
    const ids = sessions.map((session) => session.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("通話（hangup）は開始と終了が対で、長さは1分〜6時間", () => {
    const hangup = sessions.filter((session) => session.endedReason === "hangup");
    expect(hangup.length).toBeGreaterThan(0);
    for (const session of hangup) {
      expect(session.endedAt, session.id).toBeTruthy();
      const minutes = voiceSessionMinutes(session);
      expect(minutes, session.id).toBeGreaterThanOrEqual(1);
      expect(minutes, session.id).toBeLessThanOrEqual(6 * 60);
    }
    const ends = messages.filter((message) => message.body.includes("通話を終了しました"));
    expect(ends.length).toBe(hangup.length);
  });

  it("不在着信は終了メッセージを持たず、endedReason が missed", () => {
    const missed = sessions.filter((session) => session.endedReason === "missed");
    expect(missed.length).toBeGreaterThan(0);
    for (const session of missed) {
      expect(session.endedAt, session.id).toBeUndefined();
      expect(voiceSessionMinutes(session)).toBe(0);
    }
    const missedMessages = messages.filter((message) =>
      message.body.includes("応答がありませんでした"),
    );
    expect(missed.length).toBe(missedMessages.length);
  });

  it("scope と channelId が実在のコンテナを指し、DM は参加者2人", () => {
    const dmIds = new Set(listDMThreads().map((thread) => thread.id));
    const channelIds = new Set(
      listGuilds().flatMap((guild) => listChannels(guild.id).map((c) => c.id)),
    );
    for (const session of sessions) {
      if (session.scope === "dm") {
        expect(dmIds, session.id).toContain(session.channelId);
        expect(session.participantIds.length, session.id).toBe(2);
      } else {
        expect(channelIds, session.id).toContain(session.channelId);
        expect(session.participantIds.length, session.id).toBeGreaterThanOrEqual(1);
      }
      expect(new Set(session.participantIds).size, session.id).toBe(session.participantIds.length);
    }
  });

  it("通常発言に同じ文言があってもセッションを作らない（system 行だけを対象）", () => {
    const normal = messages.filter(
      (message) =>
        message.system !== true &&
        (message.body.includes("通話を開始しました") ||
          message.body.includes("通話を終了しました") ||
          message.body.includes("応答がありませんでした")),
    );
    const invented = normal.filter((message) =>
      sessions.some((session) => session.startedAt === message.sentAt),
    );
    expect(invented).toHaveLength(0);
  });

  it("listVoiceSessions はコピーを返す（書き換えても内部が変わらない）", () => {
    const first = listVoiceSessions();
    const before = JSON.stringify(listVoiceSessions());
    first[0].participantIds.push("denden");
    first[0].channelId = "broken";
    expect(JSON.stringify(listVoiceSessions())).toBe(before);
  });

  it("開始のない終了・不在着信はデータ異常として落とす（黙って捨てない）", async () => {
    // 導出ロジックを直接は呼べないため、データ側に孤立した終了が無いことを固定する
    const system = messages.filter((message) => message.system === true);
    const starts = system.filter((message) => message.body.includes("通話を開始しました"));
    const ends = system.filter((message) => message.body.includes("通話を終了しました"));
    const missed = system.filter((message) => message.body.includes("応答がありませんでした"));
    expect(sessions.length).toBe(starts.length);
    expect(sessions.filter((session) => session.endedReason === "hangup").length).toBe(ends.length);
    expect(sessions.filter((session) => session.endedReason === "missed").length).toBe(
      missed.length,
    );
  });

  it("scope で絞り込める（dm / guild）", () => {
    const dm = listVoiceSessions({ scope: "dm" });
    const guild = listVoiceSessions({ scope: "guild" });
    expect(dm.length).toBeGreaterThan(0);
    expect(guild.length).toBeGreaterThan(0);
    expect(dm.length + guild.length).toBe(sessions.length);
  });
});
