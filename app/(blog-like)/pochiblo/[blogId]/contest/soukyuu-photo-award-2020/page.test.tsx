import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { listAllEntries, listBlogs } from "@/lib/blog-like";
import {
  PHOTO_CONTEST_BLOG_ID,
  PHOTO_CONTEST_NAME,
  PHOTO_CONTEST_RESULT_PATH,
} from "@/lib/seo/contest";
import { canonicalUrl } from "@/lib/seo/site";
import EntryPage, { generateMetadata as entryMetadata } from "../../entry/[entryId]/page";
import BlogTopPage, { generateMetadata as blogMetadata } from "../../page";
import ContestResultPage, { metadata } from "./page";

const BLOG = listBlogs().find((blog) => blog.id === PHOTO_CONTEST_BLOG_ID);
if (!BLOG) {
  throw new Error("ブログのデータが見つかりません");
}

const params = Promise.resolve({ blogId: BLOG.id });
const emptySearch = Promise.resolve({});

describe("写真コンテストの結果ページ（#77 手順8）", () => {
  it("結果ページは200で、コンテスト名・受賞者の本名・作品名を出す", async () => {
    const { container } = render(await ContestResultPage({ params, searchParams: emptySearch }));
    const html = container.innerHTML;

    expect(html).toContain(PHOTO_CONTEST_NAME);
    // 受賞者名は「受賞者を確認する」（s07）まで伏せる（#76 順序7）
    expect(html).not.toContain("服部 由比");
    expect(html).toContain("帰り道");
    expect(html).toContain("優秀賞");
    // noindex は付けない
    expect(container.querySelector('meta[name="robots"]')).toBeNull();
  });

  it("metadata は結果ページ用の title・description・canonical", () => {
    expect(metadata.title).toEqual({ absolute: `${PHOTO_CONTEST_NAME} 結果` });
    expect(metadata.description).toContain(PHOTO_CONTEST_NAME);
    expect(metadata.alternates?.canonical).toBe(canonicalUrl(PHOTO_CONTEST_RESULT_PATH));
    expect(metadata.robots).toBeUndefined();
  });

  it("存在しないブログでは 404（notFound）", async () => {
    await expect(
      ContestResultPage({
        params: Promise.resolve({ blogId: "nope" }),
        searchParams: emptySearch,
      }),
    ).rejects.toThrow();
  });

  it("ブログのトップと記事に結果ページへのリンクが無い", async () => {
    const top = render(await BlogTopPage({ params, searchParams: emptySearch }));
    expect(top.container.innerHTML).not.toContain("soukyuu-photo-award-2020");
    top.unmount();

    const entry = render(
      await EntryPage({
        params: Promise.resolve({ blogId: BLOG.id, entryId: "e20181117" }),
        searchParams: emptySearch,
      }),
    );
    expect(entry.container.innerHTML).not.toContain("soukyuu-photo-award-2020");
  });

  it("sitemap に結果ページが1件だけ入る", () => {
    const urls = sitemap().map((item) => item.url);
    expect(urls.filter((url) => url.endsWith(PHOTO_CONTEST_RESULT_PATH))).toHaveLength(1);
    expect(urls).toContain(canonicalUrl(PHOTO_CONTEST_RESULT_PATH));
  });

  it("受賞記事の本文は造語のコンテスト名になり、旧名は消えている", async () => {
    const entry = listAllEntries(BLOG.id).find((candidate) => candidate.id === "e20181117");
    expect(entry).toBeDefined();
    const body = JSON.stringify(entry?.body);
    expect(body).toContain(PHOTO_CONTEST_NAME);
    expect(body).not.toContain("わかば高校生フォトコンテスト");

    // 一覧・記事の metadata に本名は混ざらない
    const entryMeta = await entryMetadata({
      params: Promise.resolve({ blogId: BLOG.id, entryId: "e20181117" }),
      searchParams: emptySearch,
    });
    expect(JSON.stringify(entryMeta)).not.toContain("服部");
    const blogMeta = await blogMetadata({ params, searchParams: emptySearch });
    expect(JSON.stringify(blogMeta)).not.toContain("服部");
  });

  it("主催者ページとして独立し、個人ブログの枠・探索の文言を出さない（#222）", async () => {
    const { container } = render(await ContestResultPage({ params, searchParams: emptySearch }));
    // 個人ブログのヘッダー・プロフィール・カウンターを出さない
    expect(container.querySelector(".pb-header")).toBeNull();
    expect(container.querySelector(".pb-profile")).toBeNull();
    expect(container.querySelector(".pb-counter")).toBeNull();
    // 「まだ見つけていない」は段階8の仕組みなので出さない
    expect(container.textContent).not.toContain("まだ見つけていない");
    // 受賞作を写真・題名・講評で並べる
    expect(container.querySelector(".contest-award-figure img")).not.toBeNull();
    expect(container.textContent).toContain("帰り道");
    expect(container.querySelectorAll(".contest-award-comment").length).toBeGreaterThanOrEqual(3);
    expect(container.querySelectorAll(".contest-award").length).toBeGreaterThanOrEqual(3);
  });
});
