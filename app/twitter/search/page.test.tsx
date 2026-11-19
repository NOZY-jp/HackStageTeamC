import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TwitterSearchPage from "./page";

const params = (q: string) => ({ searchParams: Promise.resolve({ q }) });

describe("TwitterSearchPage", () => {
  it("ポストが0件でもユーザーが見つかれば「検索結果はありません」を出す", async () => {
    // なぎは鍵垢のためユーザーだけがヒットしポストは0件になる
    render(await TwitterSearchPage(params("なぎ")));
    expect(screen.getByText("ユーザー")).toBeInTheDocument();
    expect(screen.getByText("「なぎ」の検索結果はありません")).toBeInTheDocument();
  });

  it("鍵アカウントのユーザーの名前の横に鍵アイコンを出す", async () => {
    render(await TwitterSearchPage(params("なぎ")));
    const link = screen.getByRole("link", { name: /なぎ/ });
    // なぎは認証バッジ対象外なので、名前横の .tw-icon は鍵アイコンのみ
    expect(link.querySelectorAll("svg.tw-icon")).toHaveLength(1);
  });

  it("公開アカウントのユーザーには鍵アイコンを出さない", async () => {
    render(await TwitterSearchPage(params("げーむ通信")));
    const link = screen
      .getAllByRole("link", { name: /げーむ通信/ })
      .find((el) => el.classList.contains("tw-suggest"));
    expect(link).toBeDefined();
    // 認証バッジ（tw-badge）はあっても鍵アイコン（tw-icon）は無い
    expect(link?.querySelectorAll("svg.tw-icon")).toHaveLength(0);
    expect(link?.querySelectorAll("svg.tw-badge")).toHaveLength(1);
  });

  it("ユーザー・ポストとも0件なら従来の空メッセージのまま", async () => {
    render(await TwitterSearchPage(params("zzzz")));
    expect(screen.getByText(/一致する結果はありません/)).toBeInTheDocument();
  });
});
