import { describe, expect, it } from "vitest";
import { type DataItem, itemsOf } from "./corpus";
import { KNOWN_ISSUES } from "./known-issues";
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
  duplicateNestedIds: [],
  ...overrides,
});

describe("検査の決まり", () => {
  it("作中に出さない語を見つける", () => {
    expect(forbiddenWords([item({ texts: ["ゆっちゃんへ"] })]).map(violationKey)).toEqual([
      "forbidden-word discord/messages/m1 … 「ゆっちゃん」がある",
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
    expect(invalidTimes(times("2024-02-29T00:30:00+09:00"))).toEqual([]);
    expect(invalidTimes(times("2026-11-20 12:00"))).toHaveLength(1);
    expect(invalidTimes(times("2026-11-20T12:00:00"))).toHaveLength(1);
  });

  it.each([
    "2026-13-45T99:99:99+09:00",
    "2026-02-29",
    "2026-02-30",
    "2026-02-30T10:00:00+09:00",
    "2026-11-20T24:01:00Z",
    "2026-11-20T10:00:00+09:60",
  ])("実在しない日時 %s を拒否する", (value) => {
    expect(invalidTimes([item({ times: [{ key: "sentAt", value }] })])).toHaveLength(1);
  });

  it("ゲームのいまより後の日時を見つける", () => {
    const at = (value: string) => [item({ times: [{ key: "sentAt", value }] })];
    expect(afterGameNow(at("2026-11-25T23:00:00+09:00"), "2026-11-25T23:30:00+09:00")).toEqual([]);
    expect(afterGameNow(at("2026-11-25T14:30:00Z"), "2026-11-25T23:30:00+09:00")).toEqual([]);
    expect(afterGameNow(at("2026-11-26T00:00:00+09:00"), "2026-11-25T23:30:00+09:00")).toHaveLength(
      1,
    );
  });

  it("同じデータの中の ID の重複を見つける（別のデータなら同じ ID でもよい）", () => {
    expect(duplicateIds([item({}), item({})])).toHaveLength(1);
    expect(duplicateIds([item({}), item({ dataset: "users" })])).toEqual([]);
  });

  it("入れ子の ID は同じ配列の中で重複を検出する", () => {
    const records = [
      {
        id: "thread-1",
        messages: [{ id: "m1" }, { id: "m1" }],
        anotherList: [{ id: "m1" }],
      },
      { id: "thread-2", messages: [{ id: "m1" }] },
    ];
    expect(duplicateIds(itemsOf("twixer", "conversations", records))).toEqual([
      {
        rule: "duplicate-id",
        ref: "twixer/conversations/thread-1",
        detail: "messages に ID「m1」が重複している",
      },
    ]);
  });

  it("既知の文言と同じレコードに増えた別の文言は新規違反になる", () => {
    const records = [{ id: "dm-kai-0003", body: "本名で検索したら、住所を特定しました" }];
    const keys = storyOnlyPhrases(itemsOf("discord", "dmMessages", records)).map(violationKey);
    const known = new Set(KNOWN_ISSUES.map(({ key }) => key));
    expect(keys.filter((key) => !known.has(key))).toEqual([
      "story-only-phrase discord/dmMessages/dm-kai-0003 … 物語で届くはずの「住所を特定しました」が、静的なデータにある",
    ]);
  });
});
