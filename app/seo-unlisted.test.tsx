import { describe, expect, it } from "vitest";
import { listAllEntries, listBlogs, listMylists, listPublicEntries } from "@/lib/blog-like";
import { PHOTO_CONTEST_RESULT_PATH } from "@/lib/seo/contest";
import { SITE_URL } from "@/lib/seo/site";
import { generateMetadata as entryMetadata } from "./(blog-like)/pochiblo/[blogId]/entry/[entryId]/page";
import { generateMetadata as blogTopMetadata } from "./(blog-like)/pochiblo/[blogId]/page";
import { generateMetadata as mylistMetadata } from "./(blog-like)/pochiblo/mylist/[mylistId]/page";
import robots from "./robots";
import sitemap from "./sitemap";

const urls = sitemap().map((item) => item.url);
const BLOG_ID = "denden0102";

const entryParams = (entryId: string) =>
  ({ params: Promise.resolve({ blogId: BLOG_ID, entryId }) }) as Parameters<
    typeof entryMetadata
  >[0];
const mylistParams = (mylistId: string) =>
  ({ params: Promise.resolve({ mylistId }) }) as Parameters<typeof mylistMetadata>[0];
const blogParams = (blogId: string) =>
  ({ params: Promise.resolve({ blogId }) }) as Parameters<typeof blogTopMetadata>[0];

const unlisted = listBlogs().flatMap((blog) =>
  listAllEntries(blog.id).filter((entry) => entry.visibility !== "public"),
);
const published = listBlogs().flatMap((blog) =>
  listPublicEntries(blog.id).map((entry) => ({ blogId: blog.id, entry })),
);

describe("限定公開を検索から外す（#109）", () => {
  it("sitemap に限定公開の記事URLが1件も無い", () => {
    expect(unlisted.length).toBeGreaterThan(0);
    for (const entry of unlisted) {
      const unlistedUrl = `${SITE_URL}/pochiblo/${entry.blogId}/entry/${entry.id}`;
      expect(urls).not.toContain(unlistedUrl);
    }
  });

  it("sitemap はブログトップと公開記事、コンテスト結果を含む", () => {
    for (const blog of listBlogs()) {
      expect(urls).toContain(`${SITE_URL}/pochiblo/${blog.id}`);
    }
    expect(published.length).toBeGreaterThan(0);
    for (const { blogId, entry } of published) {
      expect(urls).toContain(`${SITE_URL}/pochiblo/${blogId}/entry/${entry.id}`);
    }
    // 順序8の入口なので結果ページは sitemap に残す
    expect(urls).toContain(`${SITE_URL}${PHOTO_CONTEST_RESULT_PATH}`);
  });

  it("ブログの記事URLは「トップ + 公開記事1件」だけ", () => {
    // コンテスト結果ページ（別枠で残す）は除く
    const blogUrls = urls.filter(
      (url) => url.includes("/pochiblo/") && !url.includes(PHOTO_CONTEST_RESULT_PATH),
    );
    expect(blogUrls.sort()).toEqual(
      [
        `${SITE_URL}/pochiblo/${BLOG_ID}`,
        ...listPublicEntries(BLOG_ID).map(
          (entry) => `${SITE_URL}/pochiblo/${BLOG_ID}/entry/${entry.id}`,
        ),
      ].sort(),
    );
  });

  it("限定公開の記事ページは noindex / follow、公開記事には付けない", async () => {
    const target = unlisted[0];
    const noindex = await entryMetadata(entryParams(target.id));
    expect(noindex.robots).toEqual({ index: false, follow: true });

    const publicEntry = listPublicEntries(target.blogId)[0];
    const indexed = await entryMetadata(entryParams(publicEntry.id));
    expect(indexed.robots).toBeUndefined();
    expect(indexed.alternates?.canonical).toContain("/pochiblo/");

    // ブログトップは index のまま（robots を付けない）
    const top = await blogTopMetadata(blogParams(BLOG_ID));
    expect(top.robots).toBeUndefined();
  });

  it("マイリストは常に noindex / follow", async () => {
    const mylist = listMylists()[0];
    const meta = await mylistMetadata(mylistParams(mylist.id));
    expect(meta.robots).toEqual({ index: false, follow: true });
  });

  it("robots.txt には Disallow を書かない（noindex を読ませるため）", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      // disallow は未指定（undefined）または空配列のどちらでもよい
      expect(rule.disallow ?? []).toEqual([]);
    }
    expect(result.sitemap).toContain("/sitemap.xml");
  });
});
