import { describe, expect, it } from "vitest";
import { readChoices } from "./story-provider";

describe("保存した選択肢の読み込み", () => {
  it("前の形（場面ごとに1つ）は、選んだ順の配列として読み直す", () => {
    expect(readChoices({ a: "x", b: ["y", "z"] })).toEqual({ a: ["x"], b: ["y", "z"] });
  });

  it("壊れた値は捨てる", () => {
    expect(readChoices({ a: 1, b: ["y", 2], c: "ok" })).toEqual({ c: ["ok"] });
    expect(readChoices(null)).toEqual({});
    expect(readChoices(["x"])).toEqual({});
  });
});
