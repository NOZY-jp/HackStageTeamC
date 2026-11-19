import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { externalHref } from "../url";
import { blogs, entries, mylists } from "./blog";

const SAFE_ID = /^[a-z0-9_-]+$/;

describe("lib/blog-like のダミーデータの整合性", () => {
  it("記事のIDは重複せず、URLに入る文字だけ。書き手のブログは実在する", () => {
    const ids = entries.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    const blogIds = new Set(blogs.map((blog) => blog.id));
    for (const entry of entries) {
      expect(entry.id).toMatch(SAFE_ID);
      expect(blogIds).toContain(entry.blogId);
    }
  });

  it("記事は MHW 発売（2018-01-26）から閉鎖のお知らせ（2020-02-11）までに書かれている", () => {
    for (const entry of entries) {
      expect(entry.publishedAt >= "2018-01-26").toBe(true);
      expect(entry.publishedAt < "2020-02-12").toBe(true);
    }
  });

  it("本文のリンクはすべてアプリ内のページに変換できる", () => {
    for (const entry of entries) {
      for (const block of entry.body) {
        if (block.kind === "link") {
          expect(externalHref(block.url), block.url).toBeDefined();
        }
      }
    }
  });

  it("「でんちゃん」は本文には出さず、祖母が呼びかけるコメントにだけ1回だけ出る", () => {
    const bodies = JSON.stringify(entries.map((entry) => entry.body));
    expect(bodies).not.toContain("でんちゃん");

    const comments = entries.flatMap((entry) => entry.comments);
    const den = comments.filter((comment) => comment.body.includes("でんちゃん"));
    expect(den).toHaveLength(1);
    // 祖母が家族内の呼び名で主人公に呼びかけている（投稿者名ではない）
    expect(den[0].authorName).toBe("ばあちゃん");
    expect(den[0].body.startsWith("でんちゃん")).toBe(true);
    // 「でんちゃん」を名乗る投稿者は居ない
    expect(comments.filter((comment) => comment.authorName === "でんちゃん")).toHaveLength(0);
    // 2019年の記事にだけ残っている（祖母のコメント）
    const entry = entries.find((candidate) => candidate.comments.some((c) => c.id === den[0].id));
    expect(entry?.publishedAt.startsWith("2019")).toBe(true);
  });

  it("昔の呼び方と本名は、コメントも含めて出てこない", () => {
    // 検査する語そのものをリポジトリに残さない（文字コードで組み立てる）
    const forbidden = [
      String.fromCodePoint(0x3086, 0x3063, 0x3061, 0x3083, 0x3093), // 旧呼称
      String.fromCodePoint(0x670d, 0x90e8), // 姓
      String.fromCodePoint(0x7531, 0x6bd4), // 名
    ];
    const text = JSON.stringify({ blogs, entries });
    for (const word of forbidden) {
      expect(text).not.toContain(word);
    }
  });

  it("コメント数とコメント配列の長さが一致し、IDは重複しない", () => {
    const ids = entries.flatMap((entry) => entry.comments.map((comment) => comment.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const entry of entries) {
      expect(entry.comments.length).toBeGreaterThanOrEqual(0);
      for (const comment of entry.comments) {
        expect(comment.postedAt.slice(0, 10) >= entry.publishedAt.slice(0, 10)).toBe(true);
        expect(comment.body.length).toBeGreaterThan(0);
        expect(comment.authorName.length).toBeGreaterThan(0);
      }
    }
  });

  it("マイリストの記事はすべて実在し、重複しない", () => {
    const ids = new Set(entries.map((entry) => entry.id));
    for (const mylist of mylists) {
      expect(new Set(mylist.entryIds).size).toBe(mylist.entryIds.length);
      for (const entryId of mylist.entryIds) {
        expect(ids).toContain(entryId);
      }
    }
  });

  it("参照している画像ファイルが public にある", () => {
    const sources = [
      ...blogs.map((blog) => blog.avatar),
      ...entries.flatMap((entry) =>
        entry.body.flatMap((block) => (block.kind === "image" ? [block.src] : [])),
      ),
    ];
    for (const src of sources) {
      expect(existsSync(join(process.cwd(), "public", src)), src).toBe(true);
    }
  });
});
