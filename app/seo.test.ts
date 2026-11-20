import { describe, expect, it } from "vitest";
import { listAllEntries, listBlogs } from "@/lib/blog-like";
import { listArticles, listCreators } from "@/lib/note-like";
import { SITE_URL } from "@/lib/seo/site";
import { metadata } from "./layout";
import robots from "./robots";
import sitemap from "./sitemap";

const urls = sitemap().map((item) => item.url);

describe("SEO 基盤（#77）", () => {
  it("robots は全ページ許可で、sitemap の場所を宣言する", () => {
    const result = robots();
    expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`);

    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      expect(rule.userAgent).toBeTruthy();
      // クロールを拒否しない（Disallow を書かない）
      expect(rule.disallow ?? []).toEqual([]);
    }
  });

  it("sitemap は本番URLの絶対URLだけを持つ", () => {
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url.startsWith(`${SITE_URL}/`)).toBe(true);
      expect(url.slice(SITE_URL.length)).not.toContain("//");
    }
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("ブログのトップと全記事を含む", () => {
    const expected = listBlogs().flatMap((blog) => [
      `${SITE_URL}/pochiblo/${blog.id}`,
      ...listAllEntries(blog.id).map(
        (entry) => `${SITE_URL}/pochiblo/${blog.id}/entry/${entry.id}`,
      ),
    ]);
    for (const url of expected) {
      expect(urls).toContain(url);
    }
  });

  it("note のトップ・書き手・記事をすべて含む", () => {
    expect(urls).toContain(`${SITE_URL}/note`);
    for (const creator of listCreators()) {
      expect(urls).toContain(`${SITE_URL}/note/${creator.id}`);
    }
    for (const article of listArticles()) {
      expect(urls).toContain(`${SITE_URL}/note/${article.creatorId}/n/${article.id}`);
    }
  });

  it("Discord・Twixer・talkup のページは含めない", () => {
    for (const url of urls) {
      expect(url).not.toMatch(/\/(twitter|talkup|channels)(\/|$)/);
    }
  });

  it("404 になるサービス直下（/pochiblo・/note/search）は含めない", () => {
    expect(urls).not.toContain(`${SITE_URL}/pochiblo`);
    expect(urls).not.toContain(`${SITE_URL}/pochiblo/`);
    expect(urls.some((url) => url.includes("/note/search"))).toBe(false);
  });

  it("件数はデータと一致する", () => {
    const blogCount = listBlogs().length;
    const publicEntryCount = listBlogs().reduce(
      (total, blog) => total + listAllEntries(blog.id).length,
      0,
    );
    const noteCount = 1 + listCreators().length + listArticles().length;
    expect(urls).toHaveLength(blogCount + publicEntryCount + noteCount);
  });

  it("metadataBase は本番URLで、他の metadata は変えていない", () => {
    expect(metadata.metadataBase?.toString()).toBe(`${SITE_URL}/`);
    expect(metadata.title).toEqual({ default: "HackStage", template: "%s | HackStage" });
    expect(metadata.description).toBe("チーム開発のためのDiscord風ワークスペース");
    expect(metadata.robots).toBeUndefined();
  });
});
