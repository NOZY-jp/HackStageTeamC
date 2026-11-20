import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getEntry } from "@/lib/blog-like";
import { externalHref } from "@/lib/blog-like/url";
import { getCreator, listArticles, listArticlesByCreator } from "./index";

// 検査する語そのものをリポジトリに残さない（文字コードで組み立てる）
const word = (...codePoints: number[]) => String.fromCodePoint(...codePoints);
const FAMILY_NAME = word(0x670d, 0x90e8);
const GIVEN_NAME = word(0x7531, 0x6bd4);
const DEN = word(0x3067, 0x3093, 0x3061, 0x3083, 0x3093); // でんちゃん

const CREATOR_ID = "maimai";
const ARTICLE_ID = "maimai-2020-02-screenshot";
const GAME_SCREEN = "/discord-like/screenshot-2018-game.png";

describe("leaf の移行記事（順序4の導線・#118）", () => {
  const article = listArticles().find((candidate) => candidate.id === ARTICLE_ID);

  it("旧ブログの閉鎖告知の leaf リンク先に、書き手と記事が実在する", () => {
    // e20200211 の「新しい場所はこちら」（leaf.jp/<LEAF_CREATOR_ID>）がそのまま開ける
    const link = getEntry("denden0102", "e20200211")?.body.find((block) => block.kind === "link");
    if (link?.kind !== "link") throw new Error("leaf link missing");
    const href = externalHref(link.url);
    expect(href).toBe(`/note/${CREATOR_ID}`);
    expect(getCreator(CREATOR_ID)).toBeDefined();
    expect(listArticlesByCreator(CREATOR_ID).length).toBeGreaterThan(0);
  });

  it("公開記事一覧に、旧IDが写るゲーム画面つきの移行記事がある", () => {
    const publicArticles = listArticles();
    expect(publicArticles.map((candidate) => candidate.id)).toContain(ARTICLE_ID);
    if (!article) throw new Error("article missing");

    // 未ログインで読める公開記事（公開範囲の概念は無く、一覧に載る＝公開）
    expect(article.creatorId).toBe(CREATOR_ID);
    const images = article.body.filter((block) => block.kind === "image");
    expect(images).toHaveLength(1);
    const image = images[0];
    if (image?.kind !== "image") throw new Error("image missing");
    expect(image.src).toBe(GAME_SCREEN);
    expect(image.width).toBe(1200);
    expect(image.height).toBe(675);
    // キャプションから「旧IDが写っている」と読める（「旧」とは書かない）
    const caption = image.caption ?? "";
    expect(caption).toContain("ハンターID");
    expect(caption).not.toContain("旧");
    // 実体がある（404 を出さない）
    expect(existsSync(`public${image.src}`)).toBe(true);
  });

  it("記事に本名・呼び名を書かない", () => {
    if (!article) throw new Error("article missing");
    const text = JSON.stringify(article);
    expect(text).not.toContain(FAMILY_NAME);
    expect(text).not.toContain(GIVEN_NAME);
    expect(text).not.toContain(DEN);
    // Discord の旧IDの文字列も本文には書かない（写るのは画像だけ）
    expect(text).not.toContain("hunter_denden3243");
  });

  it("旧ブログ側は変わらない（記事は限定公開のまま・mylist も同じ）", () => {
    const entry = getEntry("denden0102", "e20200211");
    expect(entry?.visibility).toBe("public");
    // 移行記事を足しても、旧ブログの限定公開記事は公開にしない
    expect(getEntry("denden0102", "e20180421")?.visibility).toBe("unlisted");
  });
});
