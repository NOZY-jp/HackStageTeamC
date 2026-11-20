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
  it("旧 Twitter へのリンクが2件以上あり、すべてリンク切れ（broken）", () => {
    expect(linkBlocks.length).toBeGreaterThanOrEqual(2);
    for (const { block } of linkBlocks) {
      expect(block.broken).toBe(true);
      expect(block.url).toContain(OLD_TWIXER_HANDLE);
      // 現在のアカウント（@mai2mai2 相当）へは向けない
      expect(block.url).not.toContain("mai2mai2");
    }
  });

  it("リンクの表示テキストから活動名 hunter_denden / @hunter_denden0102 が読める", () => {
    const labels = linkBlocks.map(({ block }) => block.label ?? `https://${block.url}`);
    for (const label of labels) {
      expect(label).toContain(`@${OLD_TWIXER_HANDLE}`);
      expect(label).toContain("hunter_denden");
    }
    // プロフィール欄でも活動名が読める
    const blog = getBlog(BLOG_ID);
    expect(blog?.authorName).toBe("でんでん");
    expect(blog?.authorProfile).toContain(`@${OLD_TWIXER_HANDLE}`);
  });

  it("描画したリンクは遷移しない（href を持たない・aria-disabled）", () => {
    const entry = entries.find((candidate) =>
      candidate.body.some((block) => block.kind === "link" && block.url.includes("twixer.com")),
    );
    expect(entry).toBeDefined();
    const { container } = render(<EntryBody blocks={entry?.body ?? []} />);

    // Twixer への内部リンク（/twitter/...）が 1 本も無い
    expect(container.querySelectorAll('a[href*="twitter"]').length).toBe(0);
    expect(container.querySelectorAll('a[href*="twixer"]').length).toBe(0);

    const dead = container.querySelectorAll('[aria-disabled="true"]');
    expect(dead.length).toBeGreaterThanOrEqual(1);
    for (const node of dead) {
      expect(node.tagName).not.toBe("A");
      expect(node.textContent).toContain(`@${OLD_TWIXER_HANDLE}`);
    }
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
