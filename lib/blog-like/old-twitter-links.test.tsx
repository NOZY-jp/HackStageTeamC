import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EntryBody } from "@/components/blog-like/entry-body";
import { getBlog, listAllEntries } from "@/lib/blog-like";
import { OLD_TWIXER_HANDLE } from "@/lib/blog-like/data/names";

// 検査する語そのものをリポジトリに残さない（文字コードで組み立てる）
const word = (...codePoints: number[]) => String.fromCodePoint(...codePoints);
const FAMILY_NAME = word(0x670d, 0x90e8);
const GIVEN_NAME = word(0x7531, 0x6bd4);
const DEN = word(0x3067, 0x3093, 0x3061, 0x3083, 0x3093);

const BLOG_ID = "denden0102";
const entries = listAllEntries(BLOG_ID);
const linkBlocks = entries.flatMap((entry) =>
  entry.body.flatMap((block) =>
    block.kind === "link" && block.url.includes("twixer.com") ? [{ entry, block }] : [],
  ),
);

describe("旧ブログから旧 Twitter へのリンク（#97）", () => {
  it("旧 Twitter へのリンクが2件以上あり、すべて旧垢のプロフィールを指す", () => {
    expect(linkBlocks.length).toBeGreaterThanOrEqual(2);
    for (const { block } of linkBlocks) {
      expect(block.href).toBe(`/twitter/profile/${OLD_TWIXER_HANDLE}`);
      expect(block.url).toContain(OLD_TWIXER_HANDLE);
      // 現在のアカウント（@mai2mai2 相当）へは向けない
      expect(block.url).not.toContain("mai2mai2");
      // 振り返り文言は付けない
      expect(block.lead).not.toContain("当時の");
      expect(block.lead).not.toContain("旧");
    }
    const linkedEntryIds = linkBlocks.map(({ entry }) => entry.id);
    expect(linkedEntryIds).toContain("e20181117");
    expect(linkedEntryIds).toContain("e20190811");
  });

  it("リンクの表示テキストから活動名 hunter_denden / @hunter_denden0102 が読める", () => {
    const labels = linkBlocks.map(({ block }) => block.label ?? `https://${block.url}`);
    for (const label of labels) {
      expect(label).toContain(`@${OLD_TWIXER_HANDLE}`);
      expect(label).toContain("hunter_denden");
    }
    // プロフィール欄でも活動名が読める（旧垢の表示名は hunter_denden、Discord の旧垢とは別物）
    const blog = getBlog(BLOG_ID);
    expect(blog?.authorName).toBe("でんでん");
    expect(blog?.authorProfile).toContain(`@${OLD_TWIXER_HANDLE}`);
    expect(blog?.authorProfile).not.toContain("（旧）");
    // Discord の旧IDは書かない（順序4は添付画像のゲーマーID比較で気づく段階）
    expect(blog?.authorProfile).not.toContain("hunter_denden3243");
  });

  it("描画したリンクは当時のまま普通のリンクで、旧垢の画面へ飛ぶ", () => {
    const entry = entries.find((candidate) =>
      candidate.body.some((block) => block.kind === "link" && block.url.includes("twixer.com")),
    );
    expect(entry).toBeDefined();
    const { container } = render(<EntryBody blocks={entry?.body ?? []} />);

    const links = [...container.querySelectorAll("a")].filter((a) =>
      (a.getAttribute("href") ?? "").includes("/twitter/profile/"),
    );
    expect(links.length).toBeGreaterThanOrEqual(1);
    for (const link of links) {
      expect(link.getAttribute("href")).toBe(`/twitter/profile/${OLD_TWIXER_HANDLE}`);
      expect(link.textContent).toContain(`@${OLD_TWIXER_HANDLE}`);
    }
    // 表示だけの無効リンク（aria-disabled）は使わない
    expect(container.querySelectorAll('[aria-disabled="true"]').length).toBe(0);
    // 現在のアカウントへは飛ばない
    expect(container.querySelectorAll('a[href*="mai2mai2"]').length).toBe(0);
  });

  it("本名と、祖母だけが使う呼び名はリンクとプロフィールに出さない", () => {
    const blog = getBlog(BLOG_ID);
    // 祖母のコメント（#80）は対象外。ここでは今回触ったリンクとプロフィールだけを見る
    const text = JSON.stringify({
      blog,
      links: linkBlocks.map(({ block }) => block),
    });
    expect(text).not.toContain(FAMILY_NAME);
    expect(text).not.toContain(GIVEN_NAME);
    expect(text).not.toContain(DEN);
  });
});
