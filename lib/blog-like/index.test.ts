import { describe, expect, it } from "vitest";
import {
  entryPath,
  externalHref,
  formatDate,
  formatDateBand,
  getBlog,
  getEntry,
  getMylist,
  listAllEntries,
  listCategories,
  listMonths,
  listMylistEntries,
  listMylists,
  listPublicEntries,
  mylistPath,
} from "./index";

const BLOG = "denden0102";

describe("lib/blog-like のアクセサ", () => {
  it("全記事は新しい順", () => {
    const times = listAllEntries(BLOG).map((entry) => entry.publishedAt);
    expect(times.length).toBeGreaterThan(1);
    expect(times).toEqual([...times].sort().reverse());
  });

  it("公開中は閉鎖のお知らせだけで、ほかは限定公開", () => {
    const visible = listPublicEntries(BLOG);
    expect(visible.map((entry) => entry.title)).toEqual(["ブログ閉鎖のお知らせ"]);
    expect(listAllEntries(BLOG).length).toBeGreaterThan(visible.length);
  });

  it("限定公開の記事も URL からは開ける", () => {
    const unlisted = listAllEntries(BLOG).find((entry) => entry.visibility === "unlisted");
    if (!unlisted) throw new Error("unlisted entry missing");
    expect(getEntry(BLOG, unlisted.id)?.id).toBe(unlisted.id);
  });

  it("カテゴリと月別は公開中の記事だけを数える", () => {
    const total = listPublicEntries(BLOG).length;
    const sum = (list: { count: number }[]) => list.reduce((acc, item) => acc + item.count, 0);
    expect(sum(listCategories(BLOG))).toBe(total);
    expect(sum(listMonths(BLOG))).toBe(total);
  });

  it("存在しないIDでは undefined / 空配列", () => {
    expect(getBlog("missing")).toBeUndefined();
    expect(getEntry(BLOG, "missing")).toBeUndefined();
    expect(getMylist("missing")).toBeUndefined();
    expect(listAllEntries("missing")).toEqual([]);
  });

  it("戻り値を書き換えても内部状態が変わらない（深いコピー）", () => {
    const blog = getBlog(BLOG);
    if (!blog) throw new Error("blog missing");
    blog.title = "書き換え";
    expect(getBlog(BLOG)?.title).toBe("でんでんの狩猟日記");
  });
});

describe("マイリスト", () => {
  it("全記事が古い順に入っている", () => {
    const [mylist] = listMylists();
    const entries = listMylistEntries(mylist);
    expect(entries.map((entry) => entry.id).sort()).toEqual(
      listAllEntries(BLOG)
        .map((entry) => entry.id)
        .sort(),
    );
    const times = entries.map((entry) => entry.publishedAt);
    expect(times).toEqual([...times].sort());
  });

  it("パス", () => {
    expect(mylistPath("abc")).toBe("/pochiblo/mylist/abc");
  });
});

describe("externalHref", () => {
  it("作中の URL をアプリ内のパスにする", () => {
    expect(externalHref("leaf.jp/maimai")).toBe("/note/maimai");
    expect(externalHref("https://twixer.com/someone/status/123")).toBe("/twitter/post/123");
    expect(externalHref("twixer.com/someone/")).toBe("/twitter/profile/someone");
    expect(externalHref("example.com/page")).toBeUndefined();
  });

  it("余分なセグメントや壊れた status 形の Twixer URL はリンクにしない", () => {
    // <handle>/status/<id> にセグメントを足したURLは別ページ（投稿にもプロフィールにもしない）
    expect(externalHref("twixer.com/someone/status/123/extra")).toBeUndefined();
    // status の形が壊れたURLもプロフィールへフォールバックしない
    expect(externalHref("twixer.com/someone/status")).toBeUndefined();
    expect(externalHref("twixer.com/someone/likes")).toBeUndefined();
  });
});

describe("パスと日付", () => {
  it("記事のパス", () => {
    expect(entryPath(BLOG, "e1")).toBe(`/pochiblo/${BLOG}/entry/e1`);
  });

  it("日本時間の固定文字列をそのまま整形する", () => {
    expect(formatDate("2018-01-27T21:30:00+09:00")).toBe("2018年1月27日 21:30");
    expect(formatDate("2018-01-27T21:30:00+09:00", "date")).toBe("2018年1月27日");
    expect(formatDate("bad")).toBe("bad");
    expect(formatDateBand("2018-01-27T21:30:00+09:00")).toBe("2018年01月27日（土）");
    expect(formatDateBand("2020-02-11T20:30:00+09:00")).toBe("2020年02月11日（火）");
  });
});
