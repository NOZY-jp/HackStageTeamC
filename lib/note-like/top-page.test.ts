import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import NoteTopPage from "@/app/(note-like)/note/page";
import { LEAF_CREATOR_ID } from "@/lib/blog-migration/articles";
import {
  type Article,
  type ArticleBlock,
  listArticles,
  listArticlesByCreator,
  listCreators,
  listTopArticles,
  searchArticles,
} from "./index";

const SNAPSHOT: Article[] = JSON.parse(
  readFileSync(join(process.cwd(), "lib/note-like/maimai-articles.snapshot.json"), "utf8"),
);

const FROZEN_MAIMAI_ARTICLES = SNAPSHOT.filter((entry) => entry.id !== "maimai-2019-08-bow-build");

const FORBIDDEN_WORDS = [
  "でんちゃん",
  "ゆい",
  "ゆっちゃん",
  "ユイ",
  "ユッチャン",
  "yucchan",
  "ハル",
  "リョウ",
  "杉浦",
  "亮",
  "服部",
  "由比",
  "はっとり",
  "ハットリ",
  "尾崎",
  "海斗",
  "小路",
  "花音",
  "神奈川",
  "住所",
  "ストーカー",
  "蒼穹フォトアワード",
  "hunter_denden",
];

const FORBIDDEN_WORD_BOUNDARIES = /(?<![a-z])(?:hattori|yui)(?![a-z])/i;

const GAME_TAGS = new Set(["ゲーム", "モンハン", "レイド", "ギルド", "MMO", "インディーゲーム"]);

const paragraphText = (blocks: readonly ArticleBlock[]): string =>
  blocks
    .filter(
      (block): block is Extract<ArticleBlock, { kind: "paragraph" }> => block.kind === "paragraph",
    )
    .map((block) => block.text)
    .join("");

const allBodyText = (blocks: readonly ArticleBlock[]): string =>
  blocks.map((block) => ("text" in block ? block.text : "")).join("");

const charLength = (value: string): number => [...value].length;

describe("leaf トップページ刷新（#242）", () => {
  const topArticles = listTopArticles();
  const creators = listCreators();
  const nonMaimaiCreators = creators.filter((creator) => creator.id !== LEAF_CREATOR_ID);

  it("トップ一覧に MaiMai の記事は 0 件で、10人以上の書き手と30件以上の記事がある", () => {
    expect(topArticles.some((article) => article.creatorId === LEAF_CREATOR_ID)).toBe(false);
    expect(nonMaimaiCreators.length).toBeGreaterThanOrEqual(10);
    expect(topArticles.length).toBeGreaterThanOrEqual(30);
    expect(topArticles.length).toBeGreaterThanOrEqual(34);
    expect(topArticles.length).toBeLessThanOrEqual(36);
  });

  it("同一書き手の記事は 2〜5 件に収まり、3件以上連続して並ばない", () => {
    const counts = new Map<string, number>();
    for (const article of topArticles) {
      counts.set(article.creatorId, (counts.get(article.creatorId) ?? 0) + 1);
    }

    for (const creator of nonMaimaiCreators) {
      const count = counts.get(creator.id) ?? 0;
      expect(count, `${creator.id} の件数`).toBeGreaterThanOrEqual(2);
      expect(count, `${creator.id} の件数`).toBeLessThanOrEqual(5);
    }

    for (let i = 2; i < topArticles.length; i += 1) {
      const sameThree =
        topArticles[i].creatorId === topArticles[i - 1].creatorId &&
        topArticles[i].creatorId === topArticles[i - 2].creatorId;
      expect(sameThree, `${topArticles[i].id} で3件連続`).toBe(false);
    }
  });

  it("既存の7記事（tsukimi-* 4件・kado-* 3件）のID・creatorIdを保ったまま書き直されている", () => {
    const expectedExisting: Record<string, string> = {
      "tsukimi-2026-09-raid": "tsukimi_guild",
      "tsukimi-2025-12-bonenkai": "tsukimi_guild",
      "tsukimi-2024-07-update": "tsukimi_guild",
      "tsukimi-2022-03-anniversary": "tsukimi_guild",
      "kado-2026-10-autumn-beans": "kado_coffee",
      "kado-2025-05-chairs": "kado_coffee",
      "kado-2021-11-three-years": "kado_coffee",
    };

    for (const [id, creatorId] of Object.entries(expectedExisting)) {
      const found = topArticles.find((article) => article.id === id);
      expect(found, `${id} が見つかる`).toBeDefined();
      expect(found?.creatorId).toBe(creatorId);
    }
  });

  it("全トップ記事が 700字以上・5段落以上・見出し1つ以上を満たし、平均900字以上・5件以上が1,200字以上", () => {
    const paragraphLengths: number[] = [];

    for (const article of topArticles) {
      const paragraphs = article.body.filter((block) => block.kind === "paragraph");
      const headings = article.body.filter((block) => block.kind === "heading");
      const pLen = charLength(paragraphText(article.body));
      const totalLen = charLength(allBodyText(article.body));

      expect(paragraphs.length, `${article.id} の段落数`).toBeGreaterThanOrEqual(5);
      expect(headings.length, `${article.id} の見出し数`).toBeGreaterThanOrEqual(1);
      expect(pLen, `${article.id} の段落文字数`).toBeGreaterThanOrEqual(700);
      expect(totalLen, `${article.id} の全ブロック文字数`).toBeGreaterThanOrEqual(700);
      paragraphLengths.push(pLen);
    }

    const longCount = paragraphLengths.filter((len) => len >= 1200).length;
    const avg = paragraphLengths.reduce((sum, len) => sum + len, 0) / paragraphLengths.length;

    expect(longCount).toBeGreaterThanOrEqual(5);
    expect(avg).toBeGreaterThanOrEqual(900);
  });

  it("本文・書き出し20字・一文の重複が 0 件で、各記事に具体的な中身がある", () => {
    const bodies = new Set<string>();
    const openings = new Set<string>();
    const sentences = new Set<string>();

    for (const article of topArticles) {
      const pText = paragraphText(article.body);
      const opening = [...pText].slice(0, 20).join("");

      expect(bodies.has(pText), `${article.id} の本文重複`).toBe(false);
      expect(openings.has(opening), `${article.id} の書き出し重複: ${opening}`).toBe(false);
      bodies.add(pText);
      openings.add(opening);

      for (const raw of pText.split("。")) {
        const sentence = raw.trim();
        if (sentence.length === 0) continue;
        expect(sentences.has(sentence), `${article.id} の文重複: ${sentence}`).toBe(false);
        sentences.add(sentence);
      }

      const hasNumbers = /\d/.test(pText);
      const hasDialogueOrQuote =
        article.body.some((block) => block.kind === "quote") || /「[^」]{2,}」/.test(pText);
      expect(hasNumbers && hasDialogueOrQuote, `${article.id} の具体性チェック`).toBe(true);
    }
  });

  it("ゲーム関連の記事はトップの半分以下（<= 50%）に抑えられている", () => {
    const gameArticles = topArticles.filter((article) =>
      article.tags.some((tag) => GAME_TAGS.has(tag)),
    );
    expect(gameArticles.length / topArticles.length).toBeLessThanOrEqual(0.5);
  });

  it("検索と MaiMai の書き手ページは従来どおり全51件へ辿れ、既存スナップショットと完全一致する", () => {
    expect(searchArticles("双剣").some((article) => article.creatorId === LEAF_CREATOR_ID)).toBe(
      true,
    );
    expect(
      searchArticles("モンハン").some((article) => article.creatorId === LEAF_CREATOR_ID),
    ).toBe(true);

    const maimaiArticles = listArticlesByCreator(LEAF_CREATOR_ID);
    expect(maimaiArticles).toHaveLength(51);

    const allArticles = listArticles();
    for (const expected of FROZEN_MAIMAI_ARTICLES) {
      const actual = allArticles.find((article) => article.id === expected.id);
      expect(actual, expected.id).toEqual(expected);
    }
  });

  it("非MaiMai記事と新規書き手に禁止語・本名・ネタバレ語が含まれない", () => {
    for (const creator of nonMaimaiCreators) {
      const creatorText = `${creator.id}\n${creator.displayName}\n${creator.bio}`;
      for (const word of FORBIDDEN_WORDS) {
        expect(creatorText.normalize("NFKC"), creator.id).not.toContain(word);
      }
      expect(FORBIDDEN_WORD_BOUNDARIES.test(creatorText), creator.id).toBe(false);
    }

    for (const article of topArticles) {
      const text = [
        article.id,
        article.title,
        article.excerpt,
        ...article.tags,
        allBodyText(article.body),
      ].join("\n");
      for (const word of FORBIDDEN_WORDS) {
        expect(text.normalize("NFKC"), article.id).not.toContain(word);
      }
      expect(FORBIDDEN_WORD_BOUNDARIES.test(text), article.id).toBe(false);
    }
  });

  it("書き手の avatarColor は有効なHEXで、/note ページは MaiMai を除いた全トップ記事を描画する", () => {
    for (const creator of nonMaimaiCreators) {
      expect(creator.avatarColor, creator.id).toMatch(/^#[0-9a-f]{6}$/i);
      expect(Array.from(creator.displayName).length, creator.id).toBeGreaterThan(0);
    }

    render(createElement(NoteTopPage));
    expect(screen.queryByText("MaiMai")).toBeNull();
    expect(screen.queryByText("昔のブログから、ゲーム画面を移しました")).toBeNull();
    expect(screen.getAllByRole("article")).toHaveLength(topArticles.length);
  });
});
