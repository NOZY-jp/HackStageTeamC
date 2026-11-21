import { describe, expect, it } from "vitest";
import type { Message } from "@/lib/discord-like/types";
import {
  buildCallHistory,
  callHistoryByMessage,
  callHistoryLabel,
  lastCallMinutes,
} from "./call-history";

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

  it("終了も応答なしも無い開始はデータ異常としてカード化しない（#150）", () => {
    const history = buildCallHistory([
      message("c", "通話を開始しました", "2026-11-19T22:00:00+09:00"),
    ]);
    expect(history).toHaveLength(0);
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
  it("session が missed でも、応答なしの行があって初めて不在着信カードになる（#150）", () => {
    const messages = [
      message("a", "通話を開始しました", "2026-11-19T21:00:00+09:00"),
      message("m", "応答がありませんでした", "2026-11-19T21:00:30+09:00"),
    ];
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

describe("カード化と畳み込み（#150）", () => {
  const session = (startedAt: string, endedAt?: string, missed = false) => ({
    id: "s",
    scope: "dm" as const,
    channelId: "dm-maimai",
    participantIds: ["hal", "maimai"],
    startedAt,
    ...(endedAt ? { endedAt } : {}),
    endedReason: missed ? ("missed" as const) : ("hangup" as const),
  });

  it("VoiceSession のあるスレッドでも開始/終了の行をカードへ畳み込む", () => {
    const messages = [
      message("a", "通話を開始しました", "2026-11-19T21:00:00+09:00"),
      message("b", "通話を終了しました", "2026-11-19T21:05:00+09:00"),
    ];
    const { byId, hidden } = callHistoryByMessage(messages, [
      session("2026-11-19T21:00:00+09:00", "2026-11-19T21:05:00+09:00"),
    ]);
    expect(byId.get("a")?.minutes).toBe(5);
    expect([...hidden]).toEqual(["b"]);
  });

  it("不在着信カードは「応答がありませんでした」の行も畳み込む", () => {
    const messages = [
      message("a", "通話を開始しました", "2026-11-19T21:00:00+09:00"),
      message("m", "応答がありませんでした", "2026-11-19T21:00:40+09:00"),
    ];
    const { byId, hidden } = callHistoryByMessage(messages, [
      session("2026-11-19T21:00:00+09:00", undefined, true),
    ]);
    expect(callHistoryLabel(byId.get("a") as never)).toBe("不在着信");
    expect([...hidden]).toEqual(["m"]);
  });

  it("session が無いスレッドでも同じ規則（応答なしのみ不在着信、開始だけはカード化しない）", () => {
    const missedOnly = [
      message("a", "通話を開始しました", "2026-11-19T21:00:00+09:00"),
      message("m", "応答がありませんでした", "2026-11-19T21:00:40+09:00"),
    ];
    expect(buildCallHistory(missedOnly)[0]).toMatchObject({ startId: "a", missed: true });
    expect(
      buildCallHistory([message("b", "通話を開始しました", "2026-11-20T21:00:00+09:00")]),
    ).toHaveLength(0);
  });
});

describe("サーバーVCの直近通話（#150）", () => {
  it("channelId の最後の終了済みセッションから分を出す", () => {
    const sessions = [
      {
        id: "g1",
        scope: "guild" as const,
        channelId: "univ-vc-1",
        participantIds: ["ootsuka"],
        startedAt: "2026-07-10T21:00:00+09:00",
        endedAt: "2026-07-10T21:30:00+09:00",
        endedReason: "hangup" as const,
      },
      {
        id: "g2",
        scope: "guild" as const,
        channelId: "univ-vc-1",
        participantIds: ["ootsuka"],
        startedAt: "2026-08-10T21:00:00+09:00",
        endedAt: "2026-08-10T21:45:00+09:00",
        endedReason: "hangup" as const,
      },
    ];
    expect(lastCallMinutes(sessions, "univ-vc-1")).toBe(45);
    expect(lastCallMinutes(sessions, "friend-vc")).toBeUndefined();
  });
});
