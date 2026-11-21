import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TwitterSearchPage from "./page";

const params = (q: string) => ({ searchParams: Promise.resolve({ q }) });

describe("TwitterSearchPage", () => {
  it("ポストが0件でもユーザーが見つかれば「検索結果はありません」を出す", async () => {
    // まいまい（旧垢）は鍵垢のためユーザーだけがヒットしポストは0件になる
    render(await TwitterSearchPage(params("まいまい")));
    expect(screen.getByText("ユーザー")).toBeInTheDocument();
    expect(screen.getByText("「まいまい」の検索結果はありません")).toBeInTheDocument();
  });

  it("鍵アカウントのユーザーの名前の横に鍵アイコンを出す", async () => {
    render(await TwitterSearchPage(params("まいまい")));
    const link = screen.getByRole("link", { name: /まいまい/ });
    // 鍵垢なので、名前横の .tw-icon は鍵アイコン
    expect(link.querySelectorAll("svg.tw-icon")).toHaveLength(1);
  });

  it("公開アカウントのユーザーには鍵アイコンを出さない", async () => {
    render(await TwitterSearchPage(params("かのん")));
    const link = screen
      .getAllByRole("link", { name: /かのん/ })
      .find((el) => el.classList.contains("tw-suggest"));
    expect(link).toBeDefined();
    // 公開アカウントなので鍵アイコン（tw-icon）は無い
    expect(link?.querySelectorAll("svg.tw-icon")).toHaveLength(0);
  });

  it("ユーザー・ポストとも0件なら従来の空メッセージのまま", async () => {
    render(await TwitterSearchPage(params("zzzz")));
    expect(screen.getByText(/一致する結果はありません/)).toBeInTheDocument();
  });
});
