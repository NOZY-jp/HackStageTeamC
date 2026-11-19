import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { articles } from "./articles";
import { creators } from "./creators";

/** 作中の「現在」。これより後の日付の記事は置かない。 */
const NOW = "2026-11-19T23:59:59+09:00";
const SAFE_ID = /^[a-z0-9_-]+$/;
const JST_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+09:00$/;

const publicFileExists = (src: string): boolean => existsSync(join(process.cwd(), "public", src));

describe("lib/note-like のダミーデータの整合性", () => {
  it("書き手のIDは重複せず、URLに入る文字だけ", () => {
    const ids = creators.map((creator) => creator.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(SAFE_ID);
    }
  });

  it("記事のIDは重複せず、URLに入る文字だけ", () => {
    const ids = articles.map((article) => article.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(SAFE_ID);
    }
  });

  it("記事の書き手はすべて実在する", () => {
    const creatorIds = new Set(creators.map((creator) => creator.id));
    for (const article of articles) {
      expect(creatorIds).toContain(article.creatorId);
    }
  });

  it("投稿日時は日本時間の固定文字列で、作中の現在より前", () => {
    for (const article of articles) {
      expect(article.publishedAt).toMatch(JST_ISO);
      expect(article.publishedAt < NOW).toBe(true);
    }
  });

  it("参照している画像ファイルが public にある", () => {
    const sources = [
      ...creators.flatMap((creator) => (creator.avatar ? [creator.avatar] : [])),
      ...articles.flatMap((article) => [
        ...(article.cover ? [article.cover] : []),
        ...article.body.flatMap((block) => (block.kind === "image" ? [block.src] : [])),
      ]),
    ];
    for (const src of sources) {
      expect(publicFileExists(src), src).toBe(true);
    }
  });

  it("彼女のアカウント（shiro_hunt）は、引っ越した2020年から受験で止める2021年春までの記事だけ", () => {
    const own = articles.filter((article) => article.creatorId === "shiro_hunt");
    expect(own.length).toBeGreaterThan(0);
    for (const article of own) {
      expect(article.publishedAt >= "2020-01-01").toBe(true);
      expect(article.publishedAt < "2021-07-01").toBe(true);
    }
    // 最後の記事は更新停止のお知らせ
    const last = own.toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
    expect(last.title).toContain("更新を止めます");
  });
});
