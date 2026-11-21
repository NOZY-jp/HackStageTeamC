import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { metadata as searchPageMetadata } from "@/app/search/page";
import { SearchView } from "@/components/search/search-view";
import { listAllEntries, listBlogs, listPublicEntries } from "@/lib/blog-like";
import { PHOTO_CONTEST_NAME, PHOTO_CONTEST_RESULT_PATH } from "@/lib/seo/contest";
import { FORBIDDEN_WORDS } from "@/lib/story";
import { getIndexedDocuments, searchWeb } from "./index";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("lib/search (Seek 検索エンジン)", () => {
  it("公開情報のみをインデックスし、本名・禁止語・限定公開記事・非公開SNS情報を含めない", () => {
    const docs = getIndexedDocuments();
    expect(docs.length).toBeGreaterThan(0);

    const unlistedIds = listBlogs().flatMap((blog) =>
      listAllEntries(blog.id)
        .filter((entry) => entry.visibility !== "public")
        .map((entry) => entry.id),
    );
    expect(unlistedIds.length).toBeGreaterThan(0);

    for (const doc of docs) {
      const fullText = [
        doc.title,
        doc.primaryTitle,
        doc.url,
        doc.displayUrl,
        doc.summary,
        ...doc.keywords,
        ...doc.chunks,
      ].join("\n");

      for (const word of FORBIDDEN_WORDS) {
        expect(fullText, `${doc.id} に禁止語 "${word}" が混入`).not.toContain(word);
      }

      expect(doc.url).not.toContain("/pochiblo/mylist/");
      expect(doc.url).not.toContain("/twitter/profile/");
      expect(doc.url).not.toContain("/talkup/profile/");
      for (const unlistedId of unlistedIds) {
        expect(doc.url).not.toContain(`/entry/${unlistedId}`);
      }
    }
  });

  it("旧ブログ名で「でんでんの狩猟日記」のトップが最上位にヒットする", () => {
    const results = searchWeb("でんでんの狩猟日記");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.url).toBe("/pochiblo/denden0102");
    expect(results[0]?.displayUrl).toBe("pochiblo.jp/denden0102");
  });

  it("公開記事（閉鎖のお知らせ）は本文やコメントの語句でヒットし、限定公開記事はヒットしない", () => {
    const publicResults = searchWeb("ブログ閉鎖");
    expect(publicResults.some((r) => r.url === "/pochiblo/denden0102/entry/e20200211")).toBe(true);

    // 公開コメントの文言が検索対象に含まれていること
    const publicEntry = listPublicEntries("denden0102").find((e) => e.id === "e20200211");
    expect(publicEntry?.comments.length).toBeGreaterThan(0);
    const commentResults = searchWeb("下位装備の記事");
    expect(commentResults.some((r) => r.url === "/pochiblo/denden0102/entry/e20200211")).toBe(true);

    // 限定公開記事のタイトル・祖母のコメントはヒットしない
    expect(searchWeb("高校、合格しました")).toEqual([]);
    expect(searchWeb("ばあちゃん")).toEqual([]);
    expect(searchWeb("写真コンテストで賞をもらいました")).toEqual([]);
  });

  it("写真コンテスト名（空白あり／なし）で結果ページがヒットし、スニペットに本名を出さない", () => {
    const withSpace = searchWeb(PHOTO_CONTEST_NAME);
    const withoutSpace = searchWeb("蒼穹フォトアワード2020");

    for (const results of [withSpace, withoutSpace]) {
      const contest = results.find((r) => r.url === PHOTO_CONTEST_RESULT_PATH);
      expect(contest).toBeDefined();
      expect(contest?.displayUrl).toBe("pochiblo.jp/denden0102/contest/soukyuu-photo-award-2020");
      for (const word of FORBIDDEN_WORDS) {
        expect(contest?.title).not.toContain(word);
        expect(contest?.snippet).not.toContain(word);
      }
    }
  });

  it("leaf のクリエイター（MaiMai）と記事（スクショ記事など）がヒットし、タイトル一致が上位に来る", () => {
    const creatorResults = searchWeb("MaiMai");
    expect(creatorResults.length).toBeGreaterThan(0);
    expect(creatorResults[0]?.url).toBe("/note/maimai");

    const articleResults = searchWeb("昔のブログ ゲーム画面");
    expect(articleResults.some((r) => r.url === "/note/maimai/n/maimai-2020-02-screenshot")).toBe(
      true,
    );
  });

  it("サービス公式トップはサービス名・ドメイン検索時にだけ一致し、一般語に混ざらない", () => {
    expect(searchWeb("discord").some((r) => r.kind === "service" && r.siteName === "Discord")).toBe(
      true,
    );
    expect(
      searchWeb("twixer.com").some((r) => r.kind === "service" && r.siteName === "Twixer"),
    ).toBe(true);
    expect(searchWeb("leaf").some((r) => r.kind === "service" && r.siteName === "leaf")).toBe(true);
    expect(searchWeb("talkup").some((r) => r.kind === "service" && r.siteName === "talkup")).toBe(
      true,
    );

    const clueQuery = searchWeb("写真");
    expect(clueQuery.some((r) => r.kind === "service")).toBe(false);
    const diaryQuery = searchWeb("日記");
    expect(diaryQuery.some((r) => r.kind === "service")).toBe(false);
  });

  it("「弓属性強化ガン積み構成」の検索で閉鎖のお知らせが先頭に出て、削除した leaf 記事は表示されない", () => {
    const results = searchWeb("弓属性強化ガン積み構成");
    expect(results.some((result) => result.id.includes("maimai-2019-08-bow-build"))).toBe(false);
    expect(results[0]?.url).toBe("/pochiblo/denden0102/entry/e20200211");
    expect(results[0]?.snippet).toContain("弓属性強化ガン積み構成");

    for (const result of results) {
      expect(result.url).not.toContain("/entry/e20190811");
      const text = [result.title, result.snippet, result.url].join("\n");
      for (const word of FORBIDDEN_WORDS) {
        expect(text).not.toContain(word);
      }
    }
  });

  it("全角スペース区切りの AND 検索と空クエリを正しく扱う", () => {
    expect(searchWeb("")).toEqual([]);
    expect(searchWeb("　  ")).toEqual([]);

    const andMatch = searchWeb("蒼穹フォトアワード　帰り道");
    expect(andMatch.some((r) => r.url === PHOTO_CONTEST_RESULT_PATH)).toBe(true);

    const noMatch = searchWeb("蒼穹フォトアワード　存在しないキーワード");
    expect(noMatch).toEqual([]);
  });
});

describe("SearchView (Seek UI)", () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it("空クエリ時はホーム画面を描画し、フォーム送信で /search?q=... へ遷移する", async () => {
    const user = userEvent.setup();
    render(createElement(SearchView, { query: "", results: [] }));

    const input = screen.getByRole("searchbox", { name: "Seek で検索" });
    await user.type(input, "でんでんの狩猟日記{Enter}");

    expect(pushMock).toHaveBeenCalledWith(
      "/search?q=%E3%81%A7%E3%82%93%E3%81%A7%E3%82%93%E3%81%AE%E7%8B%A9%E7%8C%9F%E6%97%A5%E8%A8%98",
    );
  });

  it("検索結果の件数・作中URL・同一タブリンクを表示し、0件時も案内を出す", () => {
    expect(searchPageMetadata).toEqual({ title: "Seek 検索" });
    const results = searchWeb(PHOTO_CONTEST_NAME);
    const { rerender } = render(createElement(SearchView, { query: PHOTO_CONTEST_NAME, results }));

    expect(screen.getByText(`約 ${results.length} 件の結果`)).toBeInTheDocument();
    const contestLink = screen.getByRole("link", { name: `${PHOTO_CONTEST_NAME} 結果` });
    expect(contestLink).toHaveAttribute("href", PHOTO_CONTEST_RESULT_PATH);
    expect(contestLink).not.toHaveAttribute("target");
    const googleLink = screen.getByRole<HTMLAnchorElement>("link", { name: "Googleで検索" });
    expect(new URL(googleLink.href).searchParams.get("q")).toBe(PHOTO_CONTEST_NAME);
    expect(
      screen.getByText("pochiblo.jp/denden0102/contest/soukyuu-photo-award-2020"),
    ).toBeInTheDocument();

    rerender(createElement(SearchView, { query: "見つからない語", results: [] }));
    expect(screen.getByText("約 0 件の結果")).toBeInTheDocument();
    expect(screen.getByText(/に一致する情報は見つかりませんでした。/)).toBeInTheDocument();
  });
});
