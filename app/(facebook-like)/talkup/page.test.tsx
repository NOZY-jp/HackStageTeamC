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
  it("?q= が無いときは従来どおり全件フィードを出す", () => {
    nav.query = new URLSearchParams();
    const { container } = renderFeed();

    expect(screen.queryByText(/の検索結果/)).not.toBeInTheDocument();
    expect(container.querySelectorAll("article").length).toBeGreaterThan(5);
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
      "/talkup/profile/yui_hattori",
    );
    // (b) 関係ない投稿は出ない（全件フィードにならない）
    expect(screen.queryByText(/HackStage TeamC の新しいポータル画面/)).not.toBeInTheDocument();
    expect(container.querySelectorAll("article").length).toBeLessThan(5);

    // 該当する投稿（本人の投稿）は出る
    expect(screen.getByText(/アルバムを整理してたら入学式の写真が出てきた/)).toBeInTheDocument();
  });

  it("ヒットしない語では 0 件の表示になる", () => {
    nav.query = new URLSearchParams("q=存在しない語");
    renderFeed();

    expect(screen.getByText(/ユーザー0件/)).toBeInTheDocument();
    expect(screen.getByText("該当する投稿が見つかりませんでした。")).toBeInTheDocument();
  });
});
