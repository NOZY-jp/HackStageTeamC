import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StoryProvider, useStory } from "@/components/common/story/story-provider";
import * as twitter from "@/lib/twitter-like";
import type { Post } from "@/lib/twitter-like/types";
import TwitterSearchPage from "./page";

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));

function StoryFlagProbe() {
  const { state } = useStory();
  return <output data-testid="story-flags">{state.flags.join(",")}</output>;
}

const cookie = vi.hoisted(() => ({ found: false }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "hs-found-bff" && cookie.found ? { name, value: "1" } : undefined,
  }),
}));

const params = (q: string, f?: string) => ({ searchParams: Promise.resolve({ q, f }) });

const textPost: Post = {
  id: "test-text",
  authorId: "tw-kanon",
  postedAt: "2026-11-01T12:00:00+09:00",
  body: "添付なしのテスト投稿",
  replyCount: 0,
  repostCount: 0,
  likeCount: 0,
};
const mediaPost: Post = {
  ...textPost,
  id: "test-media",
  body: "画像つきのテスト投稿",
  media: [{ src: "/test.png", alt: "テスト画像", width: 100, height: 100 }],
};

describe("TwitterSearchPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    cookie.found = false;
  });
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
      const query = "mai2mai2";
      vi.spyOn(twitter, "searchPosts").mockReturnValue([textPost, mediaPost]);
      render(await TwitterSearchPage(params(query, f)));

      const tabs = within(screen.getByRole("navigation", { name: "検索結果の切り替え" }));
      expect(tabs.getByRole("link", { current: "page" })).toHaveTextContent(label);
      expect(tabs.getByRole("link", { name: "メディア" })).toHaveAttribute(
        "href",
        `/twitter/search?q=${encodeURIComponent(query)}&f=media`,
      );
      expect(Boolean(screen.queryByRole("region", { name: "ユーザー" }))).toBe(showsUsers);
      expect(Boolean(screen.queryByText(textPost.body))).toBe(showsTextPost);
      expect(Boolean(screen.queryByText(mediaPost.body))).toBe(showsMediaPost);

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

  it("ポストが0件でもユーザーが見つかれば「一致するポストはありません」を出す", async () => {
    // hunter_denden は旧垢（鍵垢）の bio に一致するが公開ポストは0件のためユーザーだけがヒットする
    render(await TwitterSearchPage(params("hunter_denden")));
    expect(screen.getByText("ユーザー")).toBeInTheDocument();
    expect(screen.getByText("「hunter_denden」に一致するポストはありません")).toBeInTheDocument();
    expect(screen.queryByText("「hunter_denden」の検索結果はありません")).not.toBeInTheDocument();
  });

  it("鍵アカウントのユーザーの名前の横に鍵アイコンを出す", async () => {
    render(await TwitterSearchPage(params("まいまい")));
    const link = screen.getByRole("link", { name: /まいまい/ });
    // 鍵垢なので、名前横の .tw-icon は鍵アイコン
    expect(link.querySelectorAll("svg.tw-icon")).toHaveLength(1);
  });

  it("公開アカウントのユーザーには鍵アイコンを出さない", async () => {
    render(await TwitterSearchPage(params("mai2mai2")));
    const link = screen
      .getAllByRole("link", { name: /mai2mai2/ })
      .find((el) => el.classList.contains("tw-suggest"));
    expect(link).toBeDefined();
    // 公開アカウントなので鍵アイコン（tw-icon）は無い
    expect(link?.querySelectorAll("svg.tw-icon")).toHaveLength(0);
  });

  it("発見前はかのんと post-105 を出さず、発見済みのリクエストでは出す", async () => {
    window.localStorage.clear();
    const body = twitter.getPost("post-105")?.body ?? "";
    expect(body).not.toBe("");

    cookie.found = false;
    const before = render(await TwitterSearchPage(params("kanon__dayo")));
    expect(screen.queryByRole("link", { name: /かのん/ })).not.toBeInTheDocument();
    expect(screen.queryByText(body)).not.toBeInTheDocument();
    before.unmount();

    // 発見済みは cookie でサーバーに伝わり、次のリクエストから未開放の結果を含む
    cookie.found = true;
    render(await TwitterSearchPage(params("kanon__dayo")));
    expect(screen.getAllByRole("link", { name: /かのん/ }).length).toBeGreaterThan(0);
    expect(screen.getByText(body)).toBeInTheDocument();
    window.localStorage.clear();
  });

  it("ユーザー・ポストとも0件なら従来の空メッセージのまま", async () => {
    render(await TwitterSearchPage(params("zzzz")));
    expect(screen.getByText(/一致する結果はありません/)).toBeInTheDocument();
  });

  it("発見済みなら、追加ポストを公開結果の途中に同じ検索順で表示する", async () => {
    window.localStorage.clear();
    const query = "写真";
    const body = twitter.getPost("post-107")?.body ?? "";
    expect(body).not.toBe("");
    cookie.found = true;

    render(await TwitterSearchPage(params(query, "live")));

    const discovered = screen.getByText(body);
    const region = screen.getByRole("region", { name: "ポスト" });
    const results = within(region).getAllByRole("article");
    const expected = twitter.searchPosts(query, { foundBff: true });
    expect(results).toHaveLength(expected.length);
    expect(results.indexOf(discovered.closest("article") as HTMLElement)).toBe(
      expected.findIndex((post) => post.id === "post-107"),
    );
    window.localStorage.clear();
  });

  it("検索結果にリプライ(post-102)が出ただけでは s02-bff-reply を立てない", async () => {
    window.localStorage.clear();
    const view = await TwitterSearchPage(params("ブログ"));
    render(
      <StoryProvider>
        <StoryFlagProbe />
        {view}
      </StoryProvider>,
    );
    expect(screen.getByText(/弓属性強化ガン積み構成/)).toBeInTheDocument();
    expect(screen.getByTestId("story-flags")).not.toHaveTextContent("s02-bff-reply");
  });

  it("検索結果で post-102 が画面内に見えたら s02-bff-reply を立てる", async () => {
    window.localStorage.clear();
    const observers: { callback: ObserverCallback; active: boolean }[] = [];
    class MockIntersectionObserver {
      private record: { callback: ObserverCallback; active: boolean };
      constructor(callback: ObserverCallback) {
        this.record = { callback, active: true };
        observers.push(this.record);
      }
      observe() {}
      unobserve() {}
      disconnect() {
        this.record.active = false;
      }
      takeRecords() {
        return [];
      }
    }
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

    const view = await TwitterSearchPage(params("ブログ"));
    render(
      <StoryProvider>
        <StoryFlagProbe />
        {view}
      </StoryProvider>,
    );
    // post-102 のカードだけが監視対象（他の検索結果は監視しない）
    await waitFor(() => expect(observers).toHaveLength(1));
    expect(screen.getByTestId("story-flags")).not.toHaveTextContent("s02-bff-reply");

    await act(async () =>
      observers[0].callback([{ isIntersecting: true, intersectionRatio: 0.5 }]),
    );
    await waitFor(() =>
      expect(screen.getByTestId("story-flags")).toHaveTextContent("s02-bff-reply"),
    );
    expect(observers[0].active).toBe(false);
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });
});
