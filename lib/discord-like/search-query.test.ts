import { describe, expect, it } from "vitest";
import { parseDuring, parseQuery } from "./search-query";

describe("parseQuery: フィルタ", () => {
  it("すべてのフィルタを読み分け、フリーワードは小文字で残す", () => {
    const parsed = parseQuery(
      "from:MaiMai in:雑談 before:2026-08-01 after:2026-01-01 during:2026-08 has:image mentions:琥珀 pinned:true 中3 ブログ",
    );
    expect(parsed.error).toBeUndefined();
    expect(parsed.terms).toEqual(["中3", "ブログ"]);
    expect(parsed.filters).toEqual({
      from: ["MaiMai"],
      in: ["雑談"],
      before: "2026-08-01",
      after: "2026-01-01",
      during: { start: "2026-08-01", end: "2026-08-31" },
      has: ["image"],
      mentions: ["琥珀"],
      pinned: true,
    });
  });

  it("全角スペースでも区切れる", () => {
    expect(parseQuery("中3　ブログ").terms).toEqual(["中3", "ブログ"]);
  });

  it("知らない key:value はフリーワード扱い（Discord と同じ）", () => {
    const parsed = parseQuery("foo:bar 中3");
    expect(parsed.error).toBeUndefined();
    expect(parsed.terms).toEqual(["foo:bar", "中3"]);
    expect(parsed.filters.from).toEqual([]);
  });
});

describe("parseQuery: 不正なフィルタ", () => {
  it.each([
    ["before:2026-13-01", "before"],
    ["after:2026-02-30", "after"],
    ["during:2026-8", "during"],
    ["has:gif", "has"],
    ["pinned:maybe", "pinned"],
    ["from:", "from"],
  ])("%s は error になる", (input, key) => {
    const parsed = parseQuery(input);
    expect(parsed.error?.token).toBe(input);
    expect(parsed.error?.message).toContain(key);
  });

  it("不正があっても解析できる部分は残す（エラーを1つだけ返す）", () => {
    const parsed = parseQuery("中3 has:gif before:2026-01-01");
    expect(parsed.terms).toEqual(["中3"]);
    expect(parsed.filters.before).toBe("2026-01-01");
    expect(parsed.error?.token).toBe("has:gif");
  });
});

describe("parseDuring", () => {
  it("月は月初から月末まで（うるう年も）", () => {
    expect(parseDuring("2024-02")).toEqual({ start: "2024-02-01", end: "2024-02-29" });
    expect(parseDuring("2026-02")).toEqual({ start: "2026-02-01", end: "2026-02-28" });
  });

  it("年と日付にも対応する", () => {
    expect(parseDuring("2026")).toEqual({ start: "2026-01-01", end: "2026-12-31" });
    expect(parseDuring("2026-08-11")).toEqual({ start: "2026-08-11", end: "2026-08-11" });
  });

  it("不正な値は null", () => {
    expect(parseDuring("2026-13")).toBeNull();
    expect(parseDuring("2026-02-30")).toBeNull();
    expect(parseDuring("八月")).toBeNull();
  });
});
