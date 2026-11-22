import { describe, expect, it } from "vitest";
import { LEAF_CREATOR_ID } from "../blog-migration/articles";
import {
  getCreator,
  listArticles,
  listArticlesByCreator,
  listTopArticles,
  searchArticles,
} from "./index";
import type { Article } from "./types";

const forbiddenWords = ["でんちゃん", "ゆい", "ハル", "リョウ", "服部", "由比", "神奈川", "住所"];

function prose(article: Article): string {
  return article.body
    .filter((block) => block.kind === "paragraph" || block.kind === "quote")
    .map((block) => block.text)
    .join("\n");
}

describe("leaf の新着一覧", () => {
  it("MaiMai以外の記事を漏れなく並べ、書き手を分散させる", () => {
    const top = listTopArticles();
    expect(top.length).toBeGreaterThanOrEqual(30);
    expect(top.map((item) => item.id).sort()).toEqual(
      listArticles()
        .filter((item) => item.creatorId !== LEAF_CREATOR_ID)
        .map((item) => item.id)
        .sort(),
    );
    const counts = new Map<string, number>();
    for (const [index, item] of top.entries()) {
      expect(getCreator(item.creatorId), item.id).toBeDefined();
      counts.set(item.creatorId, (counts.get(item.creatorId) ?? 0) + 1);
      expect(
        item.creatorId === top[index - 1]?.creatorId &&
          item.creatorId === top[index - 2]?.creatorId,
        item.id,
      ).toBe(false);
    }
    expect(counts.size).toBeGreaterThanOrEqual(10);
    for (const [creator, count] of counts) {
      expect(count, creator).toBeGreaterThanOrEqual(2);
      expect(count, creator).toBeLessThanOrEqual(5);
    }
    expect(top.filter(({ tags }) => tags.includes("ゲーム")).length).toBeLessThanOrEqual(
      top.length / 2,
    );
  });

  it("全記事に本文・段落・見出し・具体的な描写がある", () => {
    for (const article of listTopArticles()) {
      const body = prose(article);
      expect(Array.from(body.replace(/\s/g, "")).length, article.id).toBeGreaterThanOrEqual(700);
      expect(
        article.body.filter((block) => block.kind === "paragraph" && block.text.trim()).length,
        article.id,
      ).toBeGreaterThanOrEqual(5);
      expect(
        article.body.some((block) => block.kind === "heading" && block.text.trim()),
        article.id,
      ).toBe(true);
      expect(body, article.id).toMatch(
        /「[^」]+」|[0-9一二三四五六七八九十百千]+(?:月|日|円|分|時間|枚|人|回|本|個|脚|冊|杯|段|年|号|時)/,
      );
      const displayed = [
        article.title,
        article.excerpt,
        ...article.tags,
        ...article.body.flatMap((block) => ("text" in block ? [block.text] : [])),
      ].join("\n");
      for (const word of forbiddenWords) {
        expect(displayed, article.id).not.toContain(word);
      }
    }
  });

  it("平均900字以上、1200字以上が5件以上ある", () => {
    const lengths = listTopArticles().map(
      (article) => Array.from(prose(article).replace(/\s/g, "")).length,
    );
    expect(
      lengths.reduce((sum, length) => sum + length, 0) / lengths.length,
    ).toBeGreaterThanOrEqual(900);
    expect(lengths.filter((length) => length >= 1200).length).toBeGreaterThanOrEqual(5);
  });

  it("本文・書き出し・文の使い回しがない", () => {
    const bodies = listTopArticles().map(prose);
    const openings = bodies.map((body) => Array.from(body).slice(0, 20).join(""));
    expect(new Set(bodies).size).toBe(bodies.length);
    expect(new Set(openings).size).toBe(openings.length);
    const seen = new Map<string, string>();
    for (const article of listTopArticles()) {
      const sentences = prose(article).split(/[。！？\n]/);
      for (const sentence of sentences.map((part) => part.trim()).filter(Boolean)) {
        const owner = seen.get(sentence);
        expect(
          owner === undefined || owner === article.id,
          `${sentence} (${owner} / ${article.id})`,
        ).toBe(true);
        seen.set(sentence, article.id);
      }
    }
  });

  it("MaiMaiの51件はプロフィールに残り、双剣で検索できる", () => {
    const archive = listArticlesByCreator(LEAF_CREATOR_ID);
    expect(archive).toHaveLength(51);
    expect(archive.filter(({ id }) => id.startsWith("migration-"))).toHaveLength(50);
    expect(searchArticles("双剣").some(({ creatorId }) => creatorId === LEAF_CREATOR_ID)).toBe(
      true,
    );
  });
});
