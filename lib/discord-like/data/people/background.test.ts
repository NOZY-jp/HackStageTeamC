import { describe, expect, it } from "vitest";
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
});
