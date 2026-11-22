import { describe, expect, it } from "vitest";
import { type DataItem, itemsOf } from "./corpus";
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

  it("本名の例外はコンテスト結果と検索対象プロフィールに限る", () => {
    const texts = ["服部 由比", "yui__photo"];
    const contest = item({
      platform: "pochiblo",
      dataset: "contestResults",
      id: "soukyuu-photo-award-2018",
      texts,
    });
    const profile = item({ platform: "talkup", dataset: "users", id: "u40", texts });
    expect(realNames([contest, profile])).toEqual([]);

    expect(
      realNames([
        { ...contest, dataset: "entries" },
        { ...contest, id: "other-contest" },
        { ...profile, id: "u1" },
        { ...profile, dataset: "posts", id: "fbp-001" },
      ]).map(({ ref }) => ref),
    ).toEqual(
      expect.arrayContaining([
        "pochiblo/entries/soukyuu-photo-award-2018",
        "pochiblo/contestResults/other-contest",
        "talkup/users/u1",
        "talkup/posts/fbp-001",
      ]),
    );
    expect(realNames([{ ...profile, texts: ["尾崎"] }])).toHaveLength(1);
    expect(forbiddenWords([{ ...profile, texts: ["ゆい"] }])).toHaveLength(1);
  });

  it.each(["服部さん", "ハットリ", "はっとり", "Ｈａｔｔｏｒｉ", "ユイ", "@Yui_02"])(
    "本名や読みを含む %s を静的な Discord データで検出する",
    (text) => expect(realNames([item({ texts: [text] })])).toHaveLength(1),
  );

  it("ローマ字の断片が英単語に含まれるだけなら許す", () => {
    expect(realNames([item({ texts: ["ryuichi", "mayuichi"] })])).toEqual([]);
  });

  it.each([
    "住所を特定しました",
    "本名で検索したら出てくるぞ",
    "本名で検索すれば見つかる",
    "本名を調べれば分かる",
    "本名で検索してみて",
    "Facebookなら本名で検索できるぞ",
    "本名を入れて検索してみて",
    "本名を入力して検索できます",
    "本名で調べられる",
    "Facebookの検索欄に本名を入れてみて",
    "検索窓に本名を入力してみて",
    "検索フォームへ本名を入れて検索すると",
    "本名を検索欄に入れてみる",
    "本名を検索窓に打ち込んで",
  ])("静的データに先出しされた助言・結末 %s を検出する", (text) => {
    const messages = itemsOf("discord", "dmMessages", [{ id: "new-message", body: text }]);
    expect(storyOnlyPhrases(messages)).toHaveLength(1);
  });

  it.each([
    "タグで検索すれば見つかる",
    "タグを入れて検索してみて",
    "検索欄にタグを入れて検索してみて",
    "本名で検索、やってみる",
    "作品の正式名称を調べて",
  ])("対象の助言に当たらない %s は許す", (text) =>
    expect(storyOnlyPhrases([item({ texts: [text] })])).toEqual([]),
  );

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

  it("同じレコードに対象の文言が複数あれば、それぞれ別の違反になる", () => {
    const records = [{ id: "new-message", body: "本名で検索したら、住所を特定しました" }];
    const keys = storyOnlyPhrases(itemsOf("discord", "dmMessages", records)).map(violationKey);
    expect(keys).toEqual([
      "story-only-phrase discord/dmMessages/new-message … 物語で届くはずの「住所を特定しました」が、静的なデータにある",
      "story-only-phrase discord/dmMessages/new-message … 物語で届くはずの「本名で検索したら」が、静的なデータにある",
    ]);
  });
});
