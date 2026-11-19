import { describe, expect, it } from "vitest";
import {
  entryPath,
  externalHref,
  formatDate,
  formatDateBand,
  getBlog,
  getEntry,
  listCategories,
  listEntries,
  listMonths,
} from "./index";

describe("lib/blog-like のアクセサ", () => {
  it("記事は新しい順で、いちばん新しいのが閉鎖のお知らせ", () => {
    const entries = listEntries("shirokari");
    const times = entries.map((entry) => entry.publishedAt);
    expect(times).toEqual([...times].sort().reverse());
    expect(entries[0].title).toBe("ブログ閉鎖のお知らせ");
  });

  it("存在しないIDでは undefined / 空配列", () => {
    expect(getBlog("missing")).toBeUndefined();
    expect(getEntry("shirokari", "missing")).toBeUndefined();
    expect(listEntries("missing")).toEqual([]);
  });

  it("カテゴリと月別の記事数の合計は記事数と一致する", () => {
    const total = listEntries("shirokari").length;
    const sum = (list: { count: number }[]) => list.reduce((acc, item) => acc + item.count, 0);
    expect(sum(listCategories("shirokari"))).toBe(total);
    expect(sum(listMonths("shirokari"))).toBe(total);
  });

  it("戻り値を書き換えても内部状態が変わらない（深いコピー）", () => {
    const blog = getBlog("shirokari");
    if (!blog) throw new Error("blog missing");
    blog.title = "書き換え";
    expect(getBlog("shirokari")?.title).toBe("しろの狩猟記録");
  });
});

describe("externalHref", () => {
  it("作中の URL をアプリ内のパスにする", () => {
    expect(externalHref("leaf.jp/shiro_hunt")).toBe("/note/shiro_hunt");
    expect(externalHref("https://twixer.com/someone/status/123")).toBe("/twitter/post/123");
    expect(externalHref("twixer.com/someone/")).toBe("/twitter/profile/someone");
    expect(externalHref("example.com/page")).toBeUndefined();
  });
});

describe("パスと日付", () => {
  it("記事のパス", () => {
    expect(entryPath("shirokari", "e1")).toBe("/pochiblo/shirokari/entry/e1");
  });

  it("日本時間の固定文字列をそのまま整形する", () => {
    expect(formatDate("2018-01-27T21:30:00+09:00")).toBe("2018年1月27日 21:30");
    expect(formatDate("2018-01-27T21:30:00+09:00", "date")).toBe("2018年1月27日");
    expect(formatDate("bad")).toBe("bad");
    expect(formatDateBand("2018-01-27T21:30:00+09:00")).toBe("2018年01月27日（土）");
    expect(formatDateBand("2020-02-11T20:30:00+09:00")).toBe("2020年02月11日（火）");
  });
});
