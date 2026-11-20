import fs from "node:fs/promises";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EntryBody } from "@/components/blog-like/entry-body";
import { getEntry } from "./index";

// 検査する語そのものをリポジトリに残さない（文字コードで組み立てる）
const word = (...codePoints: number[]) => String.fromCodePoint(...codePoints);
const FAMILY_NAME = word(0x670d, 0x90e8);
const GIVEN_NAME = word(0x7531, 0x6bd4);
const DEN = word(0x3067, 0x3093, 0x3061, 0x3083, 0x3093); // でんちゃん
const OLD_DISCORD_ID = word(
  0x68,
  0x75,
  0x6e,
  0x74,
  0x65,
  0x72,
  0x5f,
  0x64,
  0x65,
  0x6e,
  0x64,
  0x65,
  0x6e,
  0x33,
  0x32,
  0x34,
  0x33,
);

const BLOG_ID = "denden0102";
const ENTRY_ID = "e20180421";
const GAME_SCREEN = "/discord-like/screenshot-2018-game.png";

describe("旧ブログのゲーム画面（順序4の証拠画像・#101）", () => {
  const entry = getEntry(BLOG_ID, ENTRY_ID);
  if (!entry) {
    throw new Error(`記事 ${ENTRY_ID} が見つかりません`);
  }
  const body = entry.body;

  it("記事にゲーム画面の画像ブロックが1枚だけある", () => {
    const images = body.filter((block) => block.kind === "image");
    expect(images).toHaveLength(1);
    const image = images[0];
    if (image?.kind !== "image") throw new Error("image block missing");
    // main にマージ済みの撮影画像をそのまま参照する（新規画像は作らない）
    expect(image.src).toBe(GAME_SCREEN);
    expect(image.width).toBe(1200);
    expect(image.height).toBe(675);
    expect(image.alt.length).toBeGreaterThan(0);
    // 順序4の向き: 旧ブログの証拠画像は「当時のゲーム画面（旧ID）」側。現IDの Discord スクショではない
    expect(image.src).not.toBe("/discord-like/screenshot-2026-friends.png");
    expect(image.src).not.toBe("/discord-like/screenshot-2019-lobby.png");
  });

  it("キャプションから「当時のゲーム画面」と読め、ゲーム内IDが映っていることが分かる", () => {
    const image = body.find((block) => block.kind === "image");
    if (image?.kind !== "image") throw new Error("image block missing");
    const caption = image.caption ?? "";
    expect(caption).toContain("当時のゲーム画面");
    // 画面に写る名前とIDを指す言い方にする（「旧」とは書かない）
    expect(caption).toContain("ハンターID");
    expect(caption).not.toContain("旧");
  });

  it("画像の実体が public にあり、縦横比がブロックの指定と合う", async () => {
    const buffer = await fs.readFile(`public${GAME_SCREEN}`);
    // PNG のシグネチャと IHDR（幅・高さ）
    expect(buffer.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(buffer.readUInt32BE(16)).toBe(1200);
    expect(buffer.readUInt32BE(20)).toBe(675);
  });

  it("本文・キャプションに本名・呼び名・Discord 旧IDを書かない", () => {
    const text = JSON.stringify(body);
    expect(text).not.toContain(FAMILY_NAME);
    expect(text).not.toContain(GIVEN_NAME);
    expect(text).not.toContain(DEN);
    expect(text).not.toContain(OLD_DISCORD_ID);
  });

  it("記事ページに画像とキャプションが出る", () => {
    const { container } = render(<EntryBody blocks={body} />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(decodeURIComponent(img?.getAttribute("src") ?? "")).toContain(
      "screenshot-2018-game.png",
    );
    expect(img?.getAttribute("alt") ?? "").toContain("ゲーム画面");
    const caption = container.querySelector("figcaption")?.textContent ?? "";
    expect(caption).toContain("当時のゲーム画面");
    // リンク（Twixer）は従来どおり残る
    expect(container.querySelectorAll("a").length).toBeGreaterThan(0);
  });

  it("画像は原寸（PNG）へのリンクで開ける（縮小表示でIDが読めないため）", () => {
    const { container } = render(<EntryBody blocks={body} />);
    const figure = container.querySelector("figure");
    expect(figure).not.toBeNull();

    // 画像そのものが原寸へのリンクになっている
    const imageLink = figure?.querySelector("a");
    expect(imageLink).not.toBeNull();
    expect(imageLink?.getAttribute("href")).toBe(GAME_SCREEN);
    expect(imageLink?.getAttribute("target")).toBe("_blank");
    expect(imageLink?.getAttribute("rel")).toContain("noreferrer");
    expect(imageLink?.getAttribute("aria-label")).toBe("2018年のゲーム画面を原寸で開く");
    expect(imageLink?.querySelector("img")).not.toBeNull();

    // figcaption にも原寸リンクを置く（当時のブログらしい「原寸で見る」）
    const captionLink = figure?.querySelector("figcaption a");
    expect(captionLink?.getAttribute("href")).toBe(GAME_SCREEN);
    expect(captionLink?.getAttribute("target")).toBe("_blank");
    expect(captionLink?.getAttribute("rel")).toContain("noreferrer");
    expect(captionLink?.textContent).toBe("原寸で見る");

    // 画像の alt と寸法は維持
    const img = figure?.querySelector("img");
    expect(img?.getAttribute("alt")).toContain("ゲーム画面");
    expect(img?.getAttribute("width")).toBe("1200");
    expect(img?.getAttribute("height")).toBe("675");
  });
});
