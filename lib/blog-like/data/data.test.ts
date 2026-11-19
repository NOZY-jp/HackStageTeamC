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

  it("昔の呼び方（シナリオの鍵）と本名はブログに出てこない", () => {
    const text = JSON.stringify({ blogs, entries });
    for (const word of ["でんちゃん", "ゆっちゃん", "服部", "由比"]) {
      expect(text, word).not.toContain(word);
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
