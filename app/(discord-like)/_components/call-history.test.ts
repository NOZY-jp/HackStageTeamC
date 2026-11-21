import { describe, expect, it } from "vitest";
import type { Message } from "@/lib/discord-like/types";
import { buildCallHistory, callHistoryByMessage, callHistoryLabel } from "./call-history";

const message = (id: string, body: string, sentAt: string, system = true): Message => ({
  id,
  channelId: "dm-maimai",
  authorId: "hal",
  sentAt,
  body,
  ...(system ? { system: true } : {}),
});

describe("通話履歴カードの算出（#137）", () => {
  it("開始と終了の対から通話の長さを出す", () => {
    const messages = [
      message("a", "通話を開始しました", "2026-11-19T21:00:00+09:00"),
      message("b", "通話を終了しました", "2026-11-19T21:07:30+09:00"),
    ];
    const history = buildCallHistory(messages);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ startId: "a", endId: "b", minutes: 8, missed: false });
    expect(callHistoryLabel(history[0])).toBe("通話 8分");
    // 終了メッセージはカードに畳む（二重に出さない）
    expect([...callHistoryByMessage(messages).hidden]).toEqual(["b"]);
  });

  it("終了が来ない開始は不在着信", () => {
    const history = buildCallHistory([
      message("c", "通話を開始しました", "2026-11-19T22:00:00+09:00"),
    ]);
    expect(history[0]).toMatchObject({ startId: "c", missed: true });
    expect(history[0].endId).toBeUndefined();
    expect(callHistoryLabel(history[0])).toBe("不在着信");
  });

  it("応答がありませんでした は不在着信として数える", () => {
    const history = buildCallHistory([
      message("d", "通話を開始しました", "2026-11-19T22:00:00+09:00"),
      message("e", "応答がありませんでした", "2026-11-19T22:00:30+09:00"),
    ]);
    expect(history[0]).toMatchObject({ startId: "d", endId: "e", missed: true });
    expect(history[0].minutes).toBeUndefined();
  });

  it("通常メッセージはカードにしない", () => {
    const messages = [message("f", "おやすみ", "2026-11-19T23:00:00+09:00", false)];
    expect(buildCallHistory(messages)).toEqual([]);
    expect(callHistoryByMessage(messages).byId.size).toBe(0);
  });
});

describe("通話履歴カードの誤変換防止（#134）", () => {
  it("system でない通常発言に同じ文言が入っていてもカードにしない", () => {
    const messages = [
      message("x", "通話を開始しました", "2026-11-19T21:00:00+09:00", false),
      message("y", "通話を終了しました", "2026-11-19T21:10:00+09:00", false),
    ];
    expect(buildCallHistory(messages)).toEqual([]);
    expect(callHistoryByMessage(messages).byId.size).toBe(0);
  });

  it("開始は startedAt を持つ（VoiceSession へ差し替えやすい）", () => {
    const history = buildCallHistory([
      message("a", "通話を開始しました", "2026-11-19T21:00:00+09:00"),
      message("b", "通話を終了しました", "2026-11-19T21:03:00+09:00"),
    ]);
    expect(history[0].startedAt).toBe("2026-11-19T21:00:00+09:00");
    expect(history[0].minutes).toBe(3);
  });
});

describe("VoiceSession を正にする（#149）", () => {
  it("session の endedReason=missed なら終了行が無くても不在着信", () => {
    const messages = [message("a", "通話を開始しました", "2026-11-19T21:00:00+09:00")];
    const history = buildCallHistory(messages, [
      {
        id: "s1",
        scope: "dm",
        channelId: "dm-maimai",
        participantIds: ["hal", "maimai"],
        startedAt: "2026-11-19T21:00:00+09:00",
        endedReason: "missed",
      },
    ]);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ startId: "a", missed: true });
    expect(callHistoryLabel(history[0])).toBe("不在着信");
  });

  it("session の endedAt から分を出し、終了行をカードに畳む", () => {
    const messages = [
      message("a", "通話を開始しました", "2026-11-19T21:00:00+09:00"),
      message("b", "通話を終了しました", "2026-11-19T21:12:00+09:00"),
    ];
    const history = buildCallHistory(messages, [
      {
        id: "s2",
        scope: "dm",
        channelId: "dm-maimai",
        participantIds: ["hal", "maimai"],
        startedAt: "2026-11-19T21:00:00+09:00",
        endedAt: "2026-11-19T21:12:00+09:00",
        endedReason: "hangup",
      },
    ]);
    expect(history[0]).toMatchObject({ startId: "a", endId: "b", minutes: 12, missed: false });
    expect([
      ...callHistoryByMessage(messages, [
        {
          id: "s2",
          scope: "dm",
          channelId: "dm-maimai",
          participantIds: ["hal", "maimai"],
          startedAt: "2026-11-19T21:00:00+09:00",
          endedAt: "2026-11-19T21:12:00+09:00",
          endedReason: "hangup",
        },
      ]).hidden,
    ]).toEqual(["b"]);
  });

  it("session が無い古いデータは従来どおり本文から作る", () => {
    const messages = [
      message("a", "通話を開始しました", "2026-11-19T21:00:00+09:00"),
      message("b", "通話を終了しました", "2026-11-19T21:03:00+09:00"),
    ];
    expect(buildCallHistory(messages)).toHaveLength(1);
    expect(buildCallHistory(messages)[0]).toMatchObject({ minutes: 3, missed: false });
  });
});
