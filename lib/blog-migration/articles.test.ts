import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import { externalHref, getMylist, listMylistEntries, listPublicEntries } from "../blog-like";
import { creatorHref, getCreator, listArticlesByCreator } from "../note-like";

describe("ぽちブロから leaf への記事移行", () => {
  it("閉鎖のお知らせのリンクから、同じタイトルと本文の移行記事50本を読める", () => {
    const [announcement] = listPublicEntries("denden0102");
    const migrationLink = announcement.body.find((block) => block.kind === "link");
    const creator = getCreator("maimai");
    assert(creator);
    expect(migrationLink && externalHref(migrationLink.url)).toBe(creatorHref(creator.id));

    const mylist = getMylist("k7q2m9d4");
    assert(mylist);

    const oldEntries = listMylistEntries(mylist).filter(({ id }) => id.startsWith("migration-"));
    const leafArticles = listArticlesByCreator(creator.id).filter(({ id }) =>
      id.startsWith("migration-"),
    );

    expect(oldEntries).toHaveLength(50);
    expect(leafArticles).toHaveLength(50);
    expect(new Set(oldEntries.map(({ title }) => title)).size).toBe(50);
    expect(oldEntries.every(({ visibility }) => visibility === "unlisted")).toBe(true);
    expect(leafArticles.map(({ id, title, body }) => ({ id, title, body }))).toEqual(
      oldEntries.toReversed().map(({ id, title, body }) => ({ id, title, body })),
    );
  });
});
