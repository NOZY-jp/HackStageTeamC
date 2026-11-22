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
import { resolveOmniboxInput, toDisplayUrl } from "@/lib/browser/url-map";
import {
  CONTEST_CONTACT_PATH,
  CONTEST_GUIDELINES_PATH,
  CONTEST_NAV,
  CONTEST_SITE_PATH,
} from "@/lib/contest-like/site";
import {
  PHOTO_CONTEST_BLOG_ID,
  PHOTO_CONTEST_LEGACY_PATH,
  PHOTO_CONTEST_NAME,
  PHOTO_CONTEST_RESULT_PATH,
} from "@/lib/seo/contest";
import { canonicalUrl } from "@/lib/seo/site";
import nextConfig from "@/next.config";
import GuidelinesPage, { metadata as guidelinesMetadata } from "./2020/page";
import ResultPage, { metadata as resultMetadata } from "./2020/result/page";
import ContactPage, { metadata as contactMetadata } from "./contact/page";
import ContestSiteLayout from "./layout";
import TopPage, { metadata as topMetadata } from "./page";

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

describe("写真コンテストの主催者サイト（#265 案1）", () => {
  it("トップ・募集要項・結果発表・お問い合わせの4ページがナビで行き来できる", () => {
    const { container } = render(
      <ContestSiteLayout>
        <ResultPage />
      </ContestSiteLayout>,
    );
    // 主催者サイトの枠（個人ブログの枠ではない）
    expect(container.querySelector(".contest-site")).not.toBeNull();
    expect(container.querySelector(".pb-header")).toBeNull();
    expect(container.querySelector(".pb-profile")).toBeNull();
    expect(container.querySelector(".pb-counter")).toBeNull();

    const links = [...container.querySelectorAll(".contest-site-nav a")].map((link) =>
      link.getAttribute("href"),
    );
    expect(links).toEqual(CONTEST_NAV.map((item) => item.href));
    expect(container.querySelector('.contest-site-nav a[aria-current="page"]')?.textContent).toBe(
      "結果発表",
    );
    expect(container.textContent).not.toContain("でんでんの狩猟日記");
  });

  it("作中の URL は soukyuu-photo.jp で、オムニボックスから各ページへ届く", () => {
    expect(toDisplayUrl(CONTEST_SITE_PATH)).toBe("soukyuu-photo.jp");
    expect(toDisplayUrl(CONTEST_GUIDELINES_PATH)).toBe("soukyuu-photo.jp/2020");
    expect(toDisplayUrl(PHOTO_CONTEST_RESULT_PATH)).toBe("soukyuu-photo.jp/2020/result");
    expect(toDisplayUrl(CONTEST_CONTACT_PATH)).toBe("soukyuu-photo.jp/contact");

    expect(resolveOmniboxInput("soukyuu-photo.jp")).toBe(CONTEST_SITE_PATH);
    expect(resolveOmniboxInput("soukyuu-photo.jp/2020")).toBe(CONTEST_GUIDELINES_PATH);
    expect(resolveOmniboxInput("soukyuu-photo.jp/2020/result")).toBe(PHOTO_CONTEST_RESULT_PATH);
    expect(resolveOmniboxInput("soukyuu-photo.jp/contact")).toBe(CONTEST_CONTACT_PATH);
  });

  it("トップはコンテスト名を出し、お知らせから結果発表へ進める", () => {
    const { container } = render(<TopPage />);
    expect(container.textContent).toContain(PHOTO_CONTEST_NAME);
    const resultLinks = [...container.querySelectorAll("a")].filter(
      (link) => link.getAttribute("href") === PHOTO_CONTEST_RESULT_PATH,
    );
    expect(resultLinks.length).toBeGreaterThan(0);
    // noindex は付けない
    expect(container.querySelector('meta[name="robots"]')).toBeNull();
  });

  it("募集要項に「結果はこのサイトで発表し、受賞者の名前と作品を載せる」と明記する", () => {
    const { container } = render(<GuidelinesPage />);
    expect(container.textContent).toContain(`${PHOTO_CONTEST_NAME} 募集要項`);
    expect(container.textContent).toContain("このサイトで発表");
    expect(container.textContent).toContain("お名前と作品を掲載");
  });

  it("お問い合わせページが出る", () => {
    const { container } = render(<ContactPage />);
    expect(container.textContent).toContain("お問い合わせ");
  });

  it("各ページの metadata は canonical を自分のパスに向ける", () => {
    expect(topMetadata.alternates?.canonical).toBe(canonicalUrl(CONTEST_SITE_PATH));
    expect(guidelinesMetadata.alternates?.canonical).toBe(canonicalUrl(CONTEST_GUIDELINES_PATH));
    expect(resultMetadata.alternates?.canonical).toBe(canonicalUrl(PHOTO_CONTEST_RESULT_PATH));
    expect(contactMetadata.alternates?.canonical).toBe(canonicalUrl(CONTEST_CONTACT_PATH));
    expect(resultMetadata.robots).toBeUndefined();
  });
});

describe("写真コンテストの結果発表ページ（#77 手順8・#265）", () => {
  it("コンテスト名・受賞作・講評を出し、段階7の前は本名を出さない", () => {
    const { container } = render(<ResultPage />);
    const html = container.innerHTML;

    expect(html).toContain(PHOTO_CONTEST_NAME);
    // 受賞者名は受賞記事を開く（s07）まで出さない（#76 順序7）
    expect(html).not.toContain("服部 由比");
    expect(html).toContain("帰り道");
    expect(html).toContain("優秀賞");
    // 受賞作の写真は実在ファイル
    expect(
      container.querySelector('img[src="/blog-like/photos/contest-photo.webp"]'),
    ).not.toBeNull();
    expect(container.querySelectorAll(".contest-award").length).toBeGreaterThanOrEqual(3);
    // 「まだ見つけていない」は段階8の仕組みなので出さない
    expect(container.textContent).not.toContain("まだ見つけていない");
    // noindex は付けない
    expect(container.querySelector('meta[name="robots"]')).toBeNull();
  });

  it("metadata は結果ページ用の title・description・canonical", () => {
    expect(resultMetadata.title).toEqual({ absolute: `${PHOTO_CONTEST_NAME} 結果` });
    expect(resultMetadata.description).toContain(PHOTO_CONTEST_NAME);
    expect(resultMetadata.alternates?.canonical).toBe(canonicalUrl(PHOTO_CONTEST_RESULT_PATH));
  });

  it("以前の URL（ブログの中）からは、新しいページへ恒久的に転送する", async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];
    expect(redirects).toContainEqual({
      source: PHOTO_CONTEST_LEGACY_PATH,
      destination: PHOTO_CONTEST_RESULT_PATH,
      permanent: true,
    });
    // オムニボックスに作中 URL を打った場合も、転送の効く内部パスへ届く
    expect(resolveOmniboxInput("pochiblo.jp/denden0102/contest/soukyuu-photo-award-2020")).toBe(
      PHOTO_CONTEST_LEGACY_PATH,
    );
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

  it("sitemap に主催者サイトの4ページが入り、旧 URL は入らない", () => {
    const urls = sitemap().map((item) => item.url);
    for (const path of [
      CONTEST_SITE_PATH,
      CONTEST_GUIDELINES_PATH,
      PHOTO_CONTEST_RESULT_PATH,
      CONTEST_CONTACT_PATH,
    ]) {
      expect(urls).toContain(canonicalUrl(path));
    }
    expect(urls.filter((url) => url.endsWith(PHOTO_CONTEST_RESULT_PATH))).toHaveLength(1);
    expect(urls.some((url) => url.endsWith(PHOTO_CONTEST_LEGACY_PATH))).toBe(false);
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
