import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EntryPage, {
  generateMetadata as entryMetadata,
} from "@/app/(blog-like)/pochiblo/[blogId]/entry/[entryId]/page";
import BlogTopPage, {
  generateMetadata as blogMetadata,
} from "@/app/(blog-like)/pochiblo/[blogId]/page";
import sitemap from "@/app/sitemap";
import { listAllEntries, listBlogs } from "@/lib/blog-like";
import { toDisplayUrl } from "@/lib/browser/url-map";
import { CONTEST_NAV } from "@/lib/contest-like/site";
import {
  PHOTO_CONTEST_BLOG_ID,
  PHOTO_CONTEST_LEGACY_PATH,
  PHOTO_CONTEST_NAME,
  PHOTO_CONTEST_RESULT_PATH,
} from "@/lib/seo/contest";
import { canonicalUrl } from "@/lib/seo/site";
import nextConfig from "@/next.config";
import ContestSiteLayout from "../../layout";
import ContestResultPage, { metadata } from "./page";

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  usePathname: () => "/soukyuu-photo/2020/result",
}));

const BLOG = listBlogs().find((blog) => blog.id === PHOTO_CONTEST_BLOG_ID);
if (!BLOG) {
  throw new Error("ブログのデータが見つかりません");
}

const params = Promise.resolve({ blogId: BLOG.id });
const emptySearch = Promise.resolve({});

describe("写真コンテストの結果ページ（#77 手順8）", () => {
  it("結果ページは200で、コンテスト名・受賞者の本名・作品名を出す", async () => {
    const { container } = render(<ContestResultPage />);
    const html = container.innerHTML;

    expect(html).toContain(PHOTO_CONTEST_NAME);
    // 受賞者名は「受賞者を確認する」（s07）まで伏せる（#76 順序7）
    expect(html).not.toContain("服部 由比");
    expect(html).toContain("帰り道");
    expect(html).toContain("優秀賞");
    // noindex は付けない
    expect(container.querySelector('meta[name="robots"]')).toBeNull();
  });

  it("受賞作の写真を載せ、まだ分からない名前は黒く塗って伏せる", async () => {
    const { container } = render(<ContestResultPage />);
    expect(
      container.querySelector('img[src="/blog-like/photos/contest-photo.webp"]'),
    ).not.toBeNull();
    const winner = container.querySelector("[data-contest-winner]");
    expect(winner?.getAttribute("aria-label")).toBe("伏せられた名前");
    expect(container.textContent).not.toContain("まだ見つけていない");
  });

  it("metadata は結果ページ用の title・description・canonical", () => {
    expect(metadata.title).toEqual({ absolute: `${PHOTO_CONTEST_NAME} 結果` });
    expect(metadata.description).toContain(PHOTO_CONTEST_NAME);
    expect(metadata.alternates?.canonical).toBe(canonicalUrl(PHOTO_CONTEST_RESULT_PATH));
    expect(metadata.robots).toBeUndefined();
  });

  it("主催者のサイトとして、でんでんのブログとは別の URL・見た目で出す（#222）", () => {
    expect(toDisplayUrl(PHOTO_CONTEST_RESULT_PATH)).toBe("soukyuu-photo.jp/2020/result");
    const { container } = render(
      <ContestSiteLayout>
        <ContestResultPage />
      </ContestSiteLayout>,
    );
    expect(container.querySelector(".sk-site")).not.toBeNull();
    // ナビから主催者サイトの各ページへ行ける
    const links = [...container.querySelectorAll(".sk-nav a")].map((link) =>
      link.getAttribute("href"),
    );
    expect(links).toEqual(CONTEST_NAV.map((item) => item.href));
    expect(container.querySelector('.sk-nav a[aria-current="page"]')?.textContent).toBe("結果発表");
    expect(container.textContent).not.toContain("でんでんの狩猟日記");
  });

  it("以前の URL（ブログの中）からは、新しいページへ恒久的に転送する", async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];
    expect(redirects).toContainEqual({
      source: PHOTO_CONTEST_LEGACY_PATH,
      destination: PHOTO_CONTEST_RESULT_PATH,
      permanent: true,
    });
  });

  it("ブログのトップと記事に結果ページへのリンクが無い", async () => {
    const top = render(await BlogTopPage({ params, searchParams: emptySearch }));
    expect(top.container.innerHTML).not.toContain("soukyuu-photo");
    top.unmount();

    const entry = render(
      await EntryPage({
        params: Promise.resolve({ blogId: BLOG.id, entryId: "e20181117" }),
        searchParams: emptySearch,
      }),
    );
    expect(entry.container.innerHTML).not.toContain("soukyuu-photo");
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
});
