import { describe, expect, it } from "vitest";
import {
  FORBIDDEN_NICKNAMES,
  MAIMAI_KANA_READINGS,
  MAIMAI_REAL_NAME_PARTS,
  MAIMAI_ROMAJI_READINGS,
} from "@/lib/platform/story-text-policy";
import { MHC_MEMBER_IDS } from "../members";
import { users } from "../users";
import { BACKGROUND_SPLIT, buildBackgroundUsers, MHC_NAMES } from "./background";

describe("mhc の背景メンバー（#243）", () => {
  it("人名・狩猟用語・日常語・英数字が予定の内訳で実際の名簿に並ぶ", () => {
    expect(Object.values(MHC_NAMES).map((group) => group.length)).toEqual([125, 62, 50, 13]);
    expect(MHC_NAMES.alphanumeric.every(([name]) => /[a-z].*\d|\d.*[a-z]/i.test(name))).toBe(true);

    const roster = buildBackgroundUsers().slice(0, BACKGROUND_SPLIT.mhc);
    expect(roster.map((user) => user.id)).toEqual(
      MHC_MEMBER_IDS.filter((id) => id.startsWith("bg-")),
    );
    expect(new Set(roster.map((user) => user.displayName))).toEqual(
      new Set(
        Object.values(MHC_NAMES)
          .flat()
          .map(([name]) => name),
      ),
    );
    expect(roster[0]?.displayName).toBe("たくみ");
  });

  it("2回生成しても同じで、背景とネームドの全員で名前とハンドルが一意", () => {
    expect(buildBackgroundUsers()).toEqual(buildBackgroundUsers());
    for (const field of ["displayName", "handle"] as const) {
      const values = users.map((user) => user[field]?.normalize("NFKC").toLowerCase());
      expect(new Set(values).size, field).toBe(users.length);
    }
  });

  it("mhcの背景名とハンドルに主要人物の名前・読み・結末の語を含めない", () => {
    const forbidden = [
      ...FORBIDDEN_NICKNAMES,
      ...MAIMAI_REAL_NAME_PARTS,
      ...MAIMAI_KANA_READINGS,
      "でんちゃん",
      "ハル",
      "はる",
      "リョウ",
      "りょう",
      "カイ",
      "かのん",
      "カノン",
      "尾崎",
      "海斗",
      "かいと",
      "カイト",
      "小路",
      "花音",
      "杉浦",
      "亮",
      "おざき",
      "オザキ",
      "すぎうら",
      "スギウラ",
      "こうじ",
      "コウジ",
      "住所",
      "番地",
      "丁目",
      "郵便番号",
      "結末",
      "黒幕",
      "犯人",
      "ビン瓶",
    ];
    const forbiddenStem = new Set([
      ...MAIMAI_ROMAJI_READINGS,
      "dendenchan",
      "kai",
      "kaito",
      "ozaki",
      "sugiura",
      "ryo",
      "ryou",
      "hal",
      "haru",
      "kanon",
      "kouji",
      "koji",
      "trueend",
      "badend",
    ]);
    for (const user of buildBackgroundUsers().slice(0, BACKGROUND_SPLIT.mhc)) {
      for (const term of forbidden) expect(user.displayName, user.id).not.toContain(term);
      const handle = user.handle?.normalize("NFKC").toLowerCase() ?? "";
      const stem = handle.replace(/_\d+$/, "");
      expect(forbiddenStem.has(stem), user.id).toBe(false);
      expect(stem, user.id).not.toMatch(/(?:true|bad)[_.-]?end|dendenchan/);
    }
  });

  it("検索対象の背景アカウントにも連番の仮名を残さない", () => {
    for (const user of buildBackgroundUsers()) {
      expect(user.displayName.normalize("NFKC"), user.id).not.toMatch(/^ハンター\d+$/);
      expect(user.handle?.normalize("NFKC"), user.id).not.toMatch(/^hunter_\d+$/i);
    }
  });
});
