import { describe, expect, it } from "vitest";
import { completeBeat, initialState } from "./engine";
import {
  autoAdvanceMs,
  charIntervalMs,
  currentMemo,
  DEFAULT_PLAYBACK,
  sliceChars,
  visibleChars,
  windowLog,
} from "./playback";
import { say, think } from "./stage";
import type { Beat } from "./types";

const monologueBeat = (id: string, memo?: string): Beat => ({
  id,
  chapter: 1,
  when: [],
  script: [think(`${id} の独り言`)],
  memo,
});

const dmBeat: Beat = {
  id: "dm-1",
  chapter: 1,
  when: [],
  script: [say("kai", "DM の文")],
};

describe("進み方", () => {
  it("クリックは自動で進まず、オートは文の長さで待ち、スキップは短く待つ", () => {
    expect(autoAdvanceMs({ mode: "click", speed: "normal" }, "あいう")).toBeNull();
    const short = autoAdvanceMs({ mode: "auto", speed: "normal" }, "あ") ?? 0;
    const long = autoAdvanceMs({ mode: "auto", speed: "normal" }, "あ".repeat(40)) ?? 0;
    expect(long).toBeGreaterThan(short);
    expect(autoAdvanceMs({ mode: "auto", speed: "normal" }, "あ".repeat(1000))).toBe(6000);
    expect(autoAdvanceMs({ mode: "skip", speed: "normal" }, "あ".repeat(40))).toBeLessThan(short);
  });

  it("文字送りの間隔は速さで変わり、スキップ・一瞬・動きを減らす設定では 0", () => {
    expect(charIntervalMs({ mode: "click", speed: "slow" })).toBeGreaterThan(
      charIntervalMs({ mode: "click", speed: "fast" }),
    );
    expect(charIntervalMs({ mode: "click", speed: "instant" })).toBe(0);
    expect(charIntervalMs({ mode: "skip", speed: "slow" })).toBe(0);
    expect(charIntervalMs(DEFAULT_PLAYBACK, true)).toBe(0);
  });

  it("文字送りは経過時間ぶんだけ出し、絵文字も1文字と数える", () => {
    expect(visibleChars("あいうえお", 0, 40)).toBe(0);
    expect(visibleChars("あいうえお", 85, 40)).toBe(2);
    expect(visibleChars("あいうえお", 10_000, 40)).toBe(5);
    expect(visibleChars("あいう", 0, 0)).toBe(3);
    expect(visibleChars("😂😂", 40, 40)).toBe(1);
    expect(sliceChars("😂あ", 1)).toBe("😂");
  });
});

describe("いまやること・ログ", () => {
  const beats = [monologueBeat("a", "カイに聞いてみる"), dmBeat, monologueBeat("b")];

  it("最後に終わった memo 付きの場面の memo を出し、次の場面があるあいだは出さない", () => {
    let state = initialState;
    expect(currentMemo(state, undefined, beats)).toBeUndefined();
    state = completeBeat(state, beats[0]);
    expect(currentMemo(state, undefined, beats)).toBe("カイに聞いてみる");
    expect(currentMemo(state, beats[1], beats)).toBeUndefined();
    // memo の無い場面が後に終わっても、前の memo が残る
    state = completeBeat(state, beats[2]);
    expect(currentMemo(state, undefined, beats)).toBe("カイに聞いてみる");
  });

  it("ログは流れた場面の文章を終わった順に返す", () => {
    let state = initialState;
    for (const beat of beats) {
      state = completeBeat(state, beat);
    }
    expect(windowLog(state, beats).map((entry) => entry.beatId)).toEqual(["a", "dm-1", "b"]);
    expect(windowLog(state, beats)[0].lines[0].text).toBe("a の独り言");
  });
});
