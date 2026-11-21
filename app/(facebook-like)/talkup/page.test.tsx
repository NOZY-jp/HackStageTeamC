import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FacebookProvider } from "@/components/facebook-like/facebook-context";
import FacebookFeedPage from "./page";

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
  it("?q= が無いときは u40（本名で捜す相手）の投稿をフィードに出さない", () => {
    nav.query = new URLSearchParams();
    const { container } = renderFeed();

    expect(screen.queryByText(/の検索結果/)).not.toBeInTheDocument();
    const articles = container.querySelectorAll("article");
    expect(articles.length).toBeGreaterThan(5);
    for (const article of Array.from(articles)) {
      expect(article.getAttribute("aria-label")).not.toBe("服部 由比の投稿");
    }
  });

  it("?q=服部 由比 で、結果ラベル・本名のユーザー・該当投稿だけを出す", () => {
    nav.query = new URLSearchParams("q=服部 由比");
    const { container } = renderFeed();

    // (c) 結果ラベル
    expect(screen.getByText(/の検索結果/)).toBeInTheDocument();
    // (a) 本名のユーザーとプロフィールへのリンク
    const users = screen.getByRole("region", { name: "該当するユーザー" });
    expect(within(users).getByRole("link", { name: /服部 由比/ })).toHaveAttribute(
      "href",
      "/talkup/profile/yui__photo",
    );
    // (b) 関係ない投稿は出ない（全件フィードにならない）
    expect(screen.queryByText(/HackStage TeamC の新しいポータル画面/)).not.toBeInTheDocument();
    const articles = container.querySelectorAll("article");
    expect(articles.length).toBeGreaterThanOrEqual(3);
    for (const article of Array.from(articles)) {
      // 描画された投稿はすべて本人（u40）のもの
      expect(article.getAttribute("aria-label")).toBe("服部 由比の投稿");
    }

    // 該当する投稿（本人の投稿）は出る
    expect(
      screen.getByText(/アルバムを整理していたら入学式の写真が出てきました/),
    ).toBeInTheDocument();
  });

  it("本名は空白の有無（半角・全角）どちらでも1ユーザー・本人の投稿だけが出る", () => {
    for (const q of ["服部 由比", "服部由比", "服部　由比"]) {
      nav.query = new URLSearchParams(`q=${q}`);
      const { container, unmount } = renderFeed();

      expect(screen.getByText(/ユーザー1件 \/ 投稿\d+件/), q).toBeInTheDocument();
      const users = screen.getByRole("region", { name: "該当するユーザー" });
      expect(within(users).getAllByRole("link"), q).toHaveLength(1);
      const articles = container.querySelectorAll("article");
      expect(articles.length, q).toBeGreaterThanOrEqual(3);
      for (const article of Array.from(articles)) {
        // 描画された投稿はすべて本人（u40）のもの
        expect(article.getAttribute("aria-label"), q).toBe("服部 由比の投稿");
      }
      unmount();
    }
  });

  it("?q= がクライアント遷移で変わると検索結果も追従する", () => {
    nav.query = new URLSearchParams();
    const { rerender } = renderFeed();
    expect(screen.queryByText(/の検索結果/)).not.toBeInTheDocument();

    nav.query = new URLSearchParams("q=服部由比");
    rerender(
      <FacebookProvider>
        <FacebookFeedPage />
      </FacebookProvider>,
    );

    expect(screen.getByText(/ユーザー1件 \/ 投稿\d+件/)).toBeInTheDocument();
  });

  it("右サイドバーの「連絡先」に本名のアカウントを出さない（検索前のネタバレ防止）", () => {
    nav.query = new URLSearchParams();
    renderFeed();

    const contacts = screen.getByRole("complementary", { name: "連絡先" });
    expect(within(contacts).queryByText(/服部/)).not.toBeInTheDocument();
    expect(within(contacts).queryByRole("link", { name: /由比/ })).not.toBeInTheDocument();
    // 他の人物は残す
    expect(within(contacts).getAllByRole("link").length).toBeGreaterThan(5);
  });

  it("ヒットしない語では 0 件の表示になる", () => {
    nav.query = new URLSearchParams("q=存在しない語");
    renderFeed();

    expect(screen.getByText(/ユーザー0件/)).toBeInTheDocument();
    expect(screen.getByText("該当する投稿が見つかりませんでした。")).toBeInTheDocument();
  });
});
