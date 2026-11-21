import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TwitterSearchPage from "./page";

const params = (q: string, f?: string) => ({ searchParams: Promise.resolve({ q, f }) });

describe("TwitterSearchPage", () => {
  it.each([
    { f: "top", label: "話題", showsUsers: true, showsTextPost: true, showsMediaPost: true },
    { f: "live", label: "最新", showsUsers: false, showsTextPost: true, showsMediaPost: true },
    {
      f: "user",
      label: "アカウント",
      showsUsers: true,
      showsTextPost: false,
      showsMediaPost: false,
    },
    {
      f: "media",
      label: "メディア",
      showsUsers: false,
      showsTextPost: false,
      showsMediaPost: true,
    },
    { f: "invalid", label: "話題", showsUsers: true, showsTextPost: true, showsMediaPost: true },
  ])(
    "$f のタブで対象の検索結果を表示する",
    async ({ f, label, showsUsers, showsTextPost, showsMediaPost }) => {
      const query = "かのん";
      render(await TwitterSearchPage(params(query, f)));

      const tabs = within(screen.getByRole("navigation", { name: "検索結果の切り替え" }));
      expect(tabs.getByRole("link", { current: "page" })).toHaveTextContent(label);
      expect(tabs.getByRole("link", { name: "メディア" })).toHaveAttribute(
        "href",
        `/twitter/search?q=${encodeURIComponent(query)}&f=media`,
      );
      expect(Boolean(screen.queryByRole("region", { name: "ユーザー" }))).toBe(showsUsers);
      expect(Boolean(screen.queryByText(/ブログにも書いて/))).toBe(showsTextPost);
      expect(Boolean(screen.queryByText(/アルバムを整理してたら/))).toBe(showsMediaPost);

      const form = screen.getByRole("searchbox", { name: "検索キーワード" }).closest("form");
      const search = new FormData(form ?? undefined);
      expect(search.get("q")).toBe(query);
      expect(search.get("f")).toBe(label === "話題" ? null : f);
    },
  );

  it("アカウントタブでユーザーが見つかればポストの空メッセージを出さない", async () => {
    render(await TwitterSearchPage(params("まいまい", "user")));
    expect(screen.getByRole("region", { name: "ユーザー" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "ポスト" })).not.toBeInTheDocument();
    expect(screen.queryByText("「まいまい」の検索結果はありません")).not.toBeInTheDocument();
  });

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
