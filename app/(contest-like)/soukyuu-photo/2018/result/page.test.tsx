import { render } from "@testing-library/react";
import type { ReactNode } from "react";
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
import ContestContactPage from "../../contact/page";
import ContestSiteLayout from "../../layout";
import ContestTopPage from "../../page";
import ContestGuidelinesPage from "../page";
import ContestResultPage, { metadata } from "./page";

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  usePathname: () => PHOTO_CONTEST_RESULT_PATH,
}));

const BLOG = listBlogs().find((blog) => blog.id === PHOTO_CONTEST_BLOG_ID);
if (!BLOG) {
  throw new Error("ブログのデータが見つかりません");
}

const params = Promise.resolve({ blogId: BLOG.id });
const emptySearch = Promise.resolve({});

const renderInSite = (page: ReactNode) => render(<ContestSiteLayout>{page}</ContestSiteLayout>);

describe("写真コンテストの主催者サイト（#265）", () => {
  it("結果ページは、コンテスト名・作品名を出し、本名は段階8まで伏せる", () => {
    const { container } = render(<ContestResultPage />);
    const html = container.innerHTML;

    expect(html).toContain(PHOTO_CONTEST_NAME);
    // 受賞者名は受賞記事を開いた後（s07）に結果ページを見るまで出さない（#76 順序7〜8）
    expect(html).not.toContain("服部 由比");
    expect(html).toContain("帰り道");
    expect(html).toContain("優秀賞");
    // noindex は付けない
    expect(container.querySelector('meta[name="robots"]')).toBeNull();
  });

  it("受賞作を写真・題名・講評で並べる", () => {
    const { container } = render(<ContestResultPage />);
    expect(
      container.querySelector('img[src="/blog-like/photos/contest-photo.webp"]'),
    ).not.toBeNull();
    expect(container.querySelectorAll(".contest-award").length).toBeGreaterThanOrEqual(3);
    expect(container.querySelectorAll(".contest-award-comment").length).toBeGreaterThanOrEqual(3);
    // 段階7までは受賞者の行ごと出さない（作中に無いボタンや伏せ字も置かない）
    expect(container.querySelector("[data-contest-winner]")).toBeNull();
    expect(container.textContent).not.toContain("まだ見つけていない");
  });

  it("metadata は結果ページ用の title・description・canonical", () => {
    expect(metadata.title).toEqual({ absolute: `${PHOTO_CONTEST_NAME} 結果` });
    expect(metadata.description).toContain(PHOTO_CONTEST_NAME);
    expect(metadata.alternates?.canonical).toBe(canonicalUrl(PHOTO_CONTEST_RESULT_PATH));
    expect(metadata.robots).toBeUndefined();
  });

  it("主催者のサイトとして独立し、作中の URL は soukyuu-photo.jp/2018/result", () => {
    expect(PHOTO_CONTEST_NAME).toBe("蒼穹フォトアワード 2018");
    expect(toDisplayUrl(PHOTO_CONTEST_RESULT_PATH)).toBe("soukyuu-photo.jp/2018/result");
    const { container } = render(
      <ContestSiteLayout>
        <ContestResultPage />
      </ContestSiteLayout>,
    );
    expect(container.querySelector(".sk-site")).not.toBeNull();
    // 個人ブログの枠・プロフィール・カウンターを出さない
    expect(container.querySelector(".pb-header")).toBeNull();
    expect(container.querySelector(".pb-profile")).toBeNull();
    expect(container.querySelector(".pb-counter")).toBeNull();
    expect(container.textContent).not.toContain("でんでんの狩り日記");
  });

  it("結果ページへのリンクはサイトのどこにも無い（検索と sitemap からだけ届く）", () => {
    const hrefs = (container: HTMLElement) =>
      [...container.querySelectorAll("a")].map((link) => link.getAttribute("href"));
    const pages = [ContestTopPage, ContestGuidelinesPage, ContestContactPage, ContestResultPage];
    for (const Page of pages) {
      const { container, unmount } = renderInSite(<Page />);
      expect(hrefs(container)).not.toContain(PHOTO_CONTEST_RESULT_PATH);
      unmount();
    }
    // ナビは結果発表を含まない
    expect(CONTEST_NAV.map((item) => item.href)).toEqual([
      "/soukyuu-photo",
      "/soukyuu-photo/2018",
      "/soukyuu-photo/contact",
    ]);
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

  it("sitemap に主催者サイトの4ページが入り、結果ページは1件だけ", () => {
    const urls = sitemap().map((item) => item.url);
    expect(urls.filter((url) => url.endsWith(PHOTO_CONTEST_RESULT_PATH))).toHaveLength(1);
    expect(urls).toContain(canonicalUrl(PHOTO_CONTEST_RESULT_PATH));
    for (const href of CONTEST_NAV.map((item) => item.href)) {
      expect(urls).toContain(canonicalUrl(href));
    }
  });

  it("受賞記事の本文は造語のコンテスト名になり、旧名は消えている", async () => {
    const entry = listAllEntries(BLOG.id).find((candidate) => candidate.id === "e20181117");
    expect(entry).toBeDefined();
    const body = JSON.stringify(entry?.body);
    expect(body).toContain(PHOTO_CONTEST_NAME);
    expect(body).not.toContain("蒼穹フォトアワード 2020");
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
