import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FacebookProvider } from "@/components/facebook-like/facebook-context";
import { listFeedPosts, listPostsByAuthor } from "@/lib/facebook-like";
import FacebookFeedPage from "./page";

const word = (...codePoints: number[]) => String.fromCodePoint(...codePoints);
const FAMILY_NAME = word(0x670d, 0x90e8);
const GIVEN_NAME = word(0x7531, 0x6bd4);
const REAL_NAME = `${FAMILY_NAME} ${GIVEN_NAME}`;
const REAL_NAME_NO_SPACE = `${FAMILY_NAME}${GIVEN_NAME}`;
const REAL_NAME_FULL_SPACE = `${FAMILY_NAME}　${GIVEN_NAME}`;

const nav = { query: new URLSearchParams() };
vi.mock("next/navigation", () => ({
  useSearchParams: () => nav.query,
  usePathname: () => "/talkup",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

const renderFeed = () =>
  render(
    <FacebookProvider>
      <FacebookFeedPage />
    </FacebookProvider>,
  );

describe("TalkUp のフィードと検索（#95）", () => {
  beforeEach(() => {
    nav.query = new URLSearchParams();
  });

  it("?q= が無いときは u40（本名で捜す相手）の投稿や文字列をフィードに出さない", () => {
    const { container } = renderFeed();
    const expectedFeedCount = listFeedPosts().length;
    expect(expectedFeedCount).toBeGreaterThan(0);

    expect(screen.queryByText(/の検索結果/)).not.toBeInTheDocument();
    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(expectedFeedCount);
    for (const article of articles) {
      expect(article).not.toHaveAttribute("aria-label", `${REAL_NAME}の投稿`);
    }
    expect(container.textContent).not.toContain(REAL_NAME);
    expect(container.textContent).not.toContain("yui__photo");
    // 没入用の画面に開発用のメタ情報を出さない
    expect(container.textContent).not.toMatch(/HackStage|モック|Discord/);
  });

  it("空白のみの ?q=%20 と ?q=%E3%80%80 では通常フィードのまま u40 を出さない", () => {
    const expectedFeedCount = listFeedPosts().length;

    for (const rawQuery of ["q=%20", "q=%E3%80%80"]) {
      nav.query = new URLSearchParams(rawQuery);
      const { container, unmount } = renderFeed();

      expect(screen.queryByText(/の検索結果/), rawQuery).not.toBeInTheDocument();
      const articles = screen.getAllByRole("article");
      expect(articles, rawQuery).toHaveLength(expectedFeedCount);
      for (const article of articles) {
        expect(article, rawQuery).not.toHaveAttribute("aria-label", `${REAL_NAME}の投稿`);
      }
      expect(container.textContent, rawQuery).not.toContain(REAL_NAME);
      expect(container.textContent, rawQuery).not.toContain("yui__photo");
      unmount();
    }
  });

  it("一般語・1文字・姓や名だけの検索では u40 の本名やハンドルを出さない", () => {
    for (const q of ["UI", "写真", "雨", "o", FAMILY_NAME, GIVEN_NAME]) {
      nav.query = new URLSearchParams({ q });
      const { container, unmount } = renderFeed();

      expect(screen.getByText(/の検索結果/), q).toBeInTheDocument();
      expect(container.textContent, q).not.toContain(REAL_NAME);
      expect(container.textContent, q).not.toContain("yui__photo");
      for (const article of container.querySelectorAll("article")) {
        expect(article, q).not.toHaveAttribute("aria-label", `${REAL_NAME}の投稿`);
      }
      unmount();
    }
  });

  it("本名検索で結果ラベル・本名のユーザー・該当投稿だけを出す", () => {
    const expectedCount = listPostsByAuthor("u40").length;
    expect(expectedCount).toBe(23);

    nav.query = new URLSearchParams({ q: REAL_NAME });
    renderFeed();

    expect(screen.getByText(/の検索結果/)).toBeInTheDocument();
    const users = screen.getByRole("region", { name: "該当するユーザー" });
    expect(within(users).getByRole("link", { name: new RegExp(REAL_NAME) })).toHaveAttribute(
      "href",
      "/talkup/profile/yui__photo",
    );
    expect(screen.queryByText(/いちょう並木/)).not.toBeInTheDocument();

    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(expectedCount);
    for (const article of articles) {
      expect(article).toHaveAttribute("aria-label", `${REAL_NAME}の投稿`);
    }

    expect(
      screen.getByText(/アルバムを整理していたら入学式の写真が出てきました/),
    ).toBeInTheDocument();
  });

  it("本名は空白の有無（半角・全角）にかかわらず1ユーザー・本人の全23件だけが出る", () => {
    const expectedCount = listPostsByAuthor("u40").length;
    expect(expectedCount).toBe(23);

    for (const q of [REAL_NAME, REAL_NAME_NO_SPACE, REAL_NAME_FULL_SPACE]) {
      nav.query = new URLSearchParams({ q });
      const { unmount } = renderFeed();

      expect(
        screen.getByText(new RegExp(`ユーザー1件 / 投稿${expectedCount}件`)),
        q,
      ).toBeInTheDocument();
      const users = screen.getByRole("region", { name: "該当するユーザー" });
      expect(within(users).getAllByRole("link"), q).toHaveLength(1);
      const articles = screen.getAllByRole("article");
      expect(articles, q).toHaveLength(expectedCount);
      for (const article of articles) {
        expect(article, q).toHaveAttribute("aria-label", `${REAL_NAME}の投稿`);
      }
      unmount();
    }
  });

  it("「クリア」ボタンを押すと u40 のない通常フィードに戻る", async () => {
    const user = userEvent.setup();
    const expectedCount = listPostsByAuthor("u40").length;
    const expectedFeedCount = listFeedPosts().length;

    nav.query = new URLSearchParams({ q: REAL_NAME });
    const { container } = renderFeed();

    expect(
      screen.getByText(new RegExp(`ユーザー1件 / 投稿${expectedCount}件`)),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "クリア" }));

    expect(screen.queryByText(/の検索結果/)).not.toBeInTheDocument();
    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(expectedFeedCount);
    expect(container.textContent).not.toContain(REAL_NAME);
    expect(container.textContent).not.toContain("yui__photo");
  });

  it("?q= がクライアント遷移で変わると検索結果も追従する", () => {
    const expectedCount = listPostsByAuthor("u40").length;
    const { rerender } = renderFeed();
    expect(screen.queryByText(/の検索結果/)).not.toBeInTheDocument();

    nav.query = new URLSearchParams({ q: REAL_NAME_NO_SPACE });
    rerender(
      <FacebookProvider>
        <FacebookFeedPage />
      </FacebookProvider>,
    );

    expect(
      screen.getByText(new RegExp(`ユーザー1件 / 投稿${expectedCount}件`)),
    ).toBeInTheDocument();
    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(expectedCount);
  });

  it("右サイドバーの「連絡先」に本名のアカウントを出さない（検索前のネタバレ防止）", () => {
    renderFeed();

    const contacts = screen.getByRole("complementary", { name: "連絡先" });
    expect(within(contacts).queryByText(new RegExp(FAMILY_NAME))).not.toBeInTheDocument();
    expect(
      within(contacts).queryByRole("link", { name: new RegExp(GIVEN_NAME) }),
    ).not.toBeInTheDocument();
    const links = within(contacts).getAllByRole("link");
    expect(links.length).toBeGreaterThan(5);
    expect(links.some((link) => link.getAttribute("href") === "/talkup/profile/yui__photo")).toBe(
      false,
    );
  });

  it("ヒットしない語では 0 件の表示になる", () => {
    nav.query = new URLSearchParams("q=存在しない語");
    renderFeed();

    expect(screen.getByText(/ユーザー0件/)).toBeInTheDocument();
    expect(screen.getByText("該当する投稿が見つかりませんでした。")).toBeInTheDocument();
  });
});
