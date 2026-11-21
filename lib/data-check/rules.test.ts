import { describe, expect, it } from "vitest";
import type { DataItem } from "./corpus";
import {
  afterGameNow,
  duplicateIds,
  forbiddenWords,
  invalidTimes,
  realNames,
  storyOnlyPhrases,
  violationKey,
} from "./rules";

const item = (overrides: Partial<DataItem>): DataItem => ({
  platform: "discord",
  dataset: "messages",
  id: "m1",
  texts: [],
  times: [],
  ...overrides,
});

describe("検査の決まり", () => {
  it("作中に出さない語を見つける", () => {
    expect(forbiddenWords([item({ texts: ["ゆっちゃんへ"] })]).map(violationKey)).toEqual([
      "forbidden-word discord/messages/m1",
    ]);
    expect(forbiddenWords([item({ texts: ["まいまい"] })])).toEqual([]);
  });

  it("本名は、置いてよいプラットフォームでだけ許す", () => {
    expect(realNames([item({ platform: "talkup", texts: ["服部 由比"] })])).toEqual([]);
    expect(realNames([item({ texts: ["服部さん"] })])).toHaveLength(1);
    expect(realNames([item({ platform: "talkup", texts: ["尾崎"] })])).toHaveLength(1);
  });

  it("物語で届く文言が静的なデータにあれば見つける", () => {
    expect(storyOnlyPhrases([item({ texts: ["住所を特定しました"] })])).toHaveLength(1);
  });

  it("日時の形（タイムゾーンつき・日付だけ）を見分ける", () => {
    const times = (value: string) => [item({ times: [{ key: "sentAt", value }] })];
    expect(invalidTimes(times("2026-11-20T12:00:00+09:00"))).toEqual([]);
    expect(invalidTimes(times("2026-11-20T03:00:00Z"))).toEqual([]);
    expect(invalidTimes(times("2026-11-01"))).toEqual([]);
    expect(invalidTimes(times("2026-11-20 12:00"))).toHaveLength(1);
    expect(invalidTimes(times("2026-11-20T12:00:00"))).toHaveLength(1);
  });

  it("ゲームのいまより後の日時を見つける", () => {
    const at = (value: string) => [item({ times: [{ key: "sentAt", value }] })];
    expect(afterGameNow(at("2026-11-25T23:00:00+09:00"), "2026-11-25T23:30:00+09:00")).toEqual([]);
    expect(afterGameNow(at("2026-11-26T00:00:00+09:00"), "2026-11-25T23:30:00+09:00")).toHaveLength(
      1,
    );
  });

  it("同じデータの中の ID の重複を見つける（別のデータなら同じ ID でもよい）", () => {
    expect(duplicateIds([item({}), item({})])).toHaveLength(1);
    expect(duplicateIds([item({}), item({ dataset: "users" })])).toEqual([]);
  });
});
