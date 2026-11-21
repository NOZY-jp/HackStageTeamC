import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StoryProvider, useStory } from "@/components/common/story/story-provider";
import { dmListPath } from "@/lib/platform/app-prefix";
import { PHOTO_CONTEST_NAME, PHOTO_CONTEST_RESULT_PATH } from "@/lib/seo/contest";
import { beats, type FlagId, SITES } from "@/lib/story";
import { BrowserChrome } from "./browser-chrome";

const nav = {
  pathname: "/twitter",
  search: "",
  push: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
};

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(nav.search),
  useRouter: () => ({
    push: nav.push,
    back: nav.back,
    forward: nav.forward,
    replace: nav.replace,
    refresh: nav.refresh,
  }),
}));

function StoryStateHelper({
  cover = false,
  withUnreadChat = false,
  fullscreenBeat = false,
}: {
  cover?: boolean;
  withUnreadChat?: boolean;
  fullscreenBeat?: boolean;
}) {
  const { setCovering, setLiveChats, setFlag, completeBeat } = useStory();
  useEffect(() => {
    setCovering(cover);
  }, [cover, setCovering]);

  useEffect(() => {
    if (!fullscreenBeat) return;
    setFlag("started");
    setFlag("leftCall");
    const ch1 = beats.find((b) => b.id === "ch1-prologue");
    if (ch1) {
      completeBeat(ch1, ["leave-call"]);
    }
  }, [fullscreenBeat, setFlag, completeBeat]);

  useEffect(() => {
    if (!withUnreadChat) {
      setLiveChats([]);
      return;
    }
    setLiveChats([
      {
        id: "test-chat-1",
        channel: "discord:dm-maimai",
        from: "maimai",
        text: "テストメッセージ",
        at: "2026-11-21T10:00:00+09:00",
      },
    ]);
  }, [withUnreadChat, setLiveChats]);

  return null;
}

function AdvanceStory({ flag }: { flag: FlagId }) {
  const { setFlag } = useStory();
  return (
    <button type="button" onClick={() => setFlag(flag)}>
      {flag}
    </button>
  );
}

function renderChrome(
  options: { cover?: boolean; withUnreadChat?: boolean; fullscreenBeat?: boolean } = {},
) {
  return render(
    <StoryProvider>
      <StoryStateHelper
        cover={options.cover}
        withUnreadChat={options.withUnreadChat}
        fullscreenBeat={options.fullscreenBeat}
      />
      <BrowserChrome />
    </StoryProvider>,
  );
}

describe("BrowserChrome", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.title = "HackStage";
    document.documentElement.style.removeProperty("--browser-chrome-height");
    nav.pathname = "/twitter";
    nav.search = "";
    nav.push.mockReset();
    nav.back.mockReset();
    nav.forward.mockReset();
  });

  it("ルートバンドル肥大化や本名混入を防ぐため、プラットフォームのデータモジュールを直接 import しない", () => {
    const source = readFileSync(
      resolve(process.cwd(), "components/common/browser/browser-chrome.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/@\/lib\/(?:blog|facebook|note|twitter)-like/);
  });

  it("現在の URL を作中 URL で表示し、アクティブなサービスに aria-current=page を付ける", () => {
    nav.pathname = "/twitter/profile/mai2mai2";
    renderChrome();

    const omnibox = screen.getByLabelText("URL または検索キーワード");
    expect(omnibox).toHaveValue("twixer.com/mai2mai2");

    const navEl = screen.getByRole("navigation", { name: "サイトブックマーク" });
    expect(within(navEl).getByRole("link", { name: "Twixer" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(navEl).queryByRole("link", { name: "Seek" })).not.toBeInTheDocument();
    expect(within(navEl).getByRole("link", { name: /Discord/ })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("実際の進行フラグに合わせて、右上のブックマークを順に開放する", async () => {
    nav.pathname = SITES.discord.href;
    const user = userEvent.setup();
    const unlocks = [
      { flag: "s01-blog-talk", label: "Twixer" },
      { flag: "s02-bff-reply", label: "Seek" },
      { flag: "s03-blog-found", label: "leaf" },
      { flag: "s09-kai-contact", label: "talkup" },
    ] as const;
    render(
      <StoryProvider>
        <BrowserChrome />
        {unlocks.map(({ flag }) => (
          <AdvanceStory key={flag} flag={flag} />
        ))}
      </StoryProvider>,
    );
    const bookmarks = within(screen.getByRole("navigation", { name: "サイトブックマーク" }));
    const labels = ["Discord"];
    expect(bookmarks.getAllByRole("link").map((link) => link.textContent)).toEqual(labels);
    for (const { flag, label } of unlocks) {
      await user.click(screen.getByRole("button", { name: flag }));
      labels.push(label);
      expect(bookmarks.getAllByRole("link").map((link) => link.textContent)).toEqual(labels);
    }
  });

  it("直接訪れたサイトを別のページや再表示でもブックマークに残す", () => {
    nav.pathname = "/note/maimai";
    const first = renderChrome();
    const leaf = screen.getByRole("link", { name: "leaf" });
    expect(leaf).toHaveAttribute("aria-current", "page");
    first.unmount();

    nav.pathname = SITES.discord.href;
    renderChrome();
    expect(screen.getByRole("link", { name: "leaf" })).not.toHaveAttribute("aria-current");
    expect(screen.queryByRole("link", { name: "talkup" })).not.toBeInTheDocument();
  });

  it("戻る・進むボタンとオムニボックスの URL 遷移・Seek 検索が動作する", async () => {
    const user = userEvent.setup();
    renderChrome();

    await user.click(screen.getByRole("button", { name: "戻る" }));
    expect(nav.back).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "進む" }));
    expect(nav.forward).toHaveBeenCalledTimes(1);

    const omnibox = screen.getByLabelText("URL または検索キーワード");
    await user.click(omnibox);
    await user.clear(omnibox);
    await user.type(omnibox, "leaf.jp/maimai{Enter}");
    expect(nav.push).toHaveBeenCalledWith("/note/maimai");

    await user.click(omnibox);
    await user.clear(omnibox);
    await user.type(omnibox, "蒼穹フォトアワード 2020{Enter}");
    expect(nav.push).toHaveBeenCalledWith(
      "/search?q=%E8%92%BC%E7%A9%B9%E3%83%95%E3%82%A9%E3%83%88%E3%82%A2%E3%83%AF%E3%83%BC%E3%83%89%202020",
    );
  });

  it("表示 URL を編集せず Enter しても検索語の # が失われない", async () => {
    const user = userEvent.setup();
    nav.pathname = "/search";
    nav.search = "q=%23%E7%B4%A0%E6%9D%90";
    renderChrome();

    const omnibox = screen.getByLabelText("URL または検索キーワード");
    expect(omnibox).toHaveValue("seek.jp/?q=%23素材");

    // フォーカス（全選択）だけして値を編集しないまま Enter する
    await user.click(omnibox);
    expect(omnibox).toHaveValue("seek.jp/?q=%23素材");
    await user.keyboard("{Enter}");

    expect(nav.push).toHaveBeenCalledTimes(1);
    expect(nav.push).toHaveBeenCalledWith("/search?q=%23%E7%B4%A0%E6%9D%90");
  });

  it("表示 URL を編集せず Enter しても検索語の A+B が A B にならない", async () => {
    const user = userEvent.setup();
    nav.pathname = "/search";
    nav.search = "q=A%2BB";
    renderChrome();

    const omnibox = screen.getByLabelText("URL または検索キーワード");
    expect(omnibox).toHaveValue("seek.jp/?q=A%2BB");

    await user.click(omnibox);
    await user.keyboard("{Enter}");

    expect(nav.push).toHaveBeenCalledTimes(1);
    expect(nav.push).toHaveBeenCalledWith("/search?q=A%2BB");
  });

  it("/story や /screens では非表示になり --browser-chrome-height を 0px にする", () => {
    nav.pathname = "/story";
    const { rerender } = renderChrome();
    expect(screen.queryByRole("banner")).toBeNull();
    expect(document.documentElement.style.getPropertyValue("--browser-chrome-height")).toBe("0px");

    nav.pathname = "/screens/2018-game";
    rerender(
      <StoryProvider>
        <BrowserChrome />
      </StoryProvider>,
    );
    expect(screen.queryByRole("banner")).toBeNull();
    expect(document.documentElement.style.getPropertyValue("--browser-chrome-height")).toBe("0px");
  });

  it("物語の場面再生中（covering=true）はブラウザバーが inert になり、fullscreen 場面では非表示になる", async () => {
    const { rerender } = renderChrome({ cover: true });
    const header = screen.getByRole("banner");
    await waitFor(() => {
      expect(header).toHaveAttribute("inert");
    });

    rerender(
      <StoryProvider>
        <StoryStateHelper cover fullscreenBeat />
        <BrowserChrome />
      </StoryProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByRole("banner")).toBeNull();
      expect(document.documentElement.style.getPropertyValue("--browser-chrome-height")).toBe(
        "0px",
      );
    });
  });

  it("Discord に未読の物語チャットがあるときだけ未読インジケータを表示する", async () => {
    nav.pathname = "/twitter";
    const { rerender } = renderChrome({ withUnreadChat: false });
    const discordLink = screen.getByRole("link", { name: /Discord/ });
    expect(within(discordLink).queryByText(/未読メッセージあり/)).toBeNull();

    rerender(
      <StoryProvider>
        <StoryStateHelper withUnreadChat />
        <BrowserChrome />
      </StoryProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /Discord/ })).toHaveTextContent("未読メッセージあり");
    });
  });

  it("探索で訪れた個人・手がかりページを静かに発見履歴へ記録し、前ページの古いタイトルを持ち越さず、Esc と外部クリックで閉じる", async () => {
    const user = userEvent.setup();
    document.title = `${PHOTO_CONTEST_NAME} 結果`;
    nav.pathname = PHOTO_CONTEST_RESULT_PATH;
    const { rerender } = renderChrome();

    // 遷移直後に document.title が前ページのままでも古いタイトルで上書きしない
    nav.pathname = "/pochiblo/denden0102";
    rerender(
      <StoryProvider>
        <BrowserChrome />
      </StoryProvider>,
    );

    // 遷移後に document.title が更新された場合は新しいタイトルへ追従する
    act(() => {
      document.title = "でんでんの狩猟日記 | HackStage";
    });

    const historyBtn = screen.getByRole("button", { name: "発見履歴" });
    expect(historyBtn).toHaveAttribute("aria-expanded", "false");

    await user.click(historyBtn);
    expect(historyBtn).toHaveAttribute("aria-expanded", "true");

    const panel = screen.getByRole("region", { name: "発見したページの履歴" });
    await waitFor(() => {
      expect(within(panel).getByRole("link", { name: /でんでんの狩猟日記/ })).toHaveAttribute(
        "href",
        "/pochiblo/denden0102",
      );
    });
    expect(
      within(panel).getByRole("link", { name: /蒼穹フォトアワード 2020 結果/ }),
    ).toHaveAttribute("href", PHOTO_CONTEST_RESULT_PATH);

    // Esc で閉じる
    await user.keyboard("{Escape}");
    expect(historyBtn).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("region", { name: "発見したページの履歴" })).toBeNull();

    // 再度開いて外部クリックで閉じる
    await user.click(historyBtn);
    expect(screen.getByRole("region", { name: "発見したページの履歴" })).toBeInTheDocument();
    await act(async () => {
      document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    expect(screen.queryByRole("region", { name: "発見したページの履歴" })).toBeNull();
  });

  it("通常ルート・検索ページは履歴に記録せず、Discord リンク先が dmListPath になる", async () => {
    const user = userEvent.setup();
    nav.pathname = "/search";
    renderChrome();
    expect(screen.getByRole("link", { name: /Discord/ })).toHaveAttribute("href", dmListPath());

    await user.click(screen.getByRole("button", { name: "発見履歴" }));
    expect(screen.getByText("まだ発見したページはありません。")).toBeInTheDocument();
  });
});
