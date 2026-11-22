import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LEAF_CREATOR_ID } from "@/lib/blog-migration/articles";
import { articles } from "./data/articles";
import { creators } from "./data/creators";
import { listArticles } from "./index";

/**
 * #211: leaf のトップが MaiMai だけにならないよう、他書き手の記事を足す。
 * MaiMai の既存3記事は物語の手がかりなので、ID・本文とも変えない。
 */

/** MaiMai の既存記事の完全な写し（本文・日付・いいね・タグまで含む）。 */
const SNAPSHOT: { id: string; creatorId: string }[] = JSON.parse(
  readFileSync(join(process.cwd(), "lib/note-like/maimai-articles.snapshot.json"), "utf8"),
);
const FORBIDDEN = ["でんちゃん", "服部", "由比", "神奈川", "住所"];

describe("Leaf のダミー記事（#211）", () => {
  it("MaiMai以外の記事が30件以上あり、書き手と記事IDが有効", () => {
    const others = articles.filter((article) => article.creatorId !== LEAF_CREATOR_ID);
    expect(articles.length).toBeGreaterThanOrEqual(81);
    expect(new Set(others.map((article) => article.creatorId)).size).toBeGreaterThanOrEqual(10);
    expect(others.length).toBeGreaterThanOrEqual(30);
    expect(new Set(articles.map(({ id }) => id)).size).toBe(articles.length);
    for (const article of others) {
      expect(
        creators.some((creator) => creator.id === article.creatorId),
        article.id,
      ).toBe(true);
    }
  });

  it("追加記事は700字以上で、禁止語を含まない", () => {
    for (const article of articles.filter((item) => item.creatorId !== LEAF_CREATOR_ID)) {
      const body = article.body.map((block) => ("text" in block ? block.text : "")).join("");
      expect([...body].length, article.id).toBeGreaterThanOrEqual(700);
      for (const word of FORBIDDEN) {
        expect(`${article.title}${article.excerpt}${body}`, article.id).not.toContain(word);
      }
    }
  });

  it("一覧は公開日の新しい順", () => {
    const list = listArticles();
    for (let i = 1; i < list.length; i += 1) {
      expect(list[i].publishedAt <= list[i - 1].publishedAt, list[i].id).toBe(true);
    }
  });

  it("MaiMaiの既存記事は、全フィールドが完全一致のまま変わっていない", () => {
    // 1件ずつIDで突き合わせる（新しい記事が増えても既存の検査は効く）
    for (const expected of SNAPSHOT.filter((entry) => entry.id !== "maimai-2019-08-bow-build")) {
      const actual = articles.find((article) => article.id === expected.id);
      expect(actual, expected.id).toEqual(expected);
    }
    expect(SNAPSHOT.some((entry) => entry.id === "maimai-2020-02-screenshot")).toBe(true);
    expect(articles.some((article) => article.id === "maimai-2019-08-bow-build")).toBe(false);
  });
});
