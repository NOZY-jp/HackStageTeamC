import { describe, expect, it } from "vitest";
import { LEAF_CREATOR_ID } from "@/lib/blog-migration/articles";
import { articles } from "./data/articles";
import { creators } from "./data/creators";
import { listArticles } from "./index";

/**
 * #211: leaf のトップが MaiMai だけにならないよう、他書き手の記事を足す。
 * MaiMai の既存3記事は物語の手がかりなので、ID・本文とも変えない。
 */

const MAIMAI_IDS = ["maimai-2020-02-screenshot", "maimai-2019-08-bow-build"];
const FORBIDDEN = ["でんちゃん", "服部", "由比", "神奈川", "住所"];

describe("Leaf のダミー記事（#211）", () => {
  it("書き手が2人以上いて、MaiMai以外の記事が3件以上ある", () => {
    const others = articles.filter((article) => article.creatorId !== LEAF_CREATOR_ID);
    expect(articles.length).toBeGreaterThanOrEqual(8);
    expect(new Set(others.map((article) => article.creatorId)).size).toBeGreaterThanOrEqual(2);
    expect(others.length).toBeGreaterThanOrEqual(3);
    for (const article of others) {
      expect(
        creators.some((creator) => creator.id === article.creatorId),
        article.id,
      ).toBe(true);
    }
  });

  it("追加記事は200字以上で、禁止語を含まない", () => {
    for (const article of articles.filter((item) => item.creatorId !== LEAF_CREATOR_ID)) {
      const body = article.body.map((block) => ("text" in block ? block.text : "")).join("");
      expect([...body].length, article.id).toBeGreaterThanOrEqual(200);
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

  it("MaiMaiの既存記事はID・本文が変わっていない", () => {
    for (const id of MAIMAI_IDS) {
      const article = articles.find((item) => item.id === id);
      expect(article, id).toBeDefined();
      expect(article?.creatorId).toBe(LEAF_CREATOR_ID);
    }
    const screenshot = articles.find((item) => item.id === "maimai-2020-02-screenshot");
    expect(JSON.stringify(screenshot?.body)).toContain("/discord-like/screenshot-2018-game.png");
  });
});
