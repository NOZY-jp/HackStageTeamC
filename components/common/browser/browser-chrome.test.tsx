import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StoryProvider, useStory } from "@/components/common/story/story-provider";
import { dmListPath } from "@/lib/platform/app-prefix";
import { PHOTO_CONTEST_RESULT_PATH } from "@/lib/seo/contest";
import { beats } from "@/lib/story";
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
    document.documentElement.style.removeProperty("--browser-chrome-height");
    nav.pathname = "/twitter";
    nav.search = "";
    nav.push.mockReset();
    nav.back.mockReset();
    nav.forward.mockReset();
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
    expect(within(navEl).getByRole("link", { name: "Seek" })).not.toHaveAttribute("aria-current");
    expect(within(navEl).getByRole("link", { name: /Discord/ })).not.toHaveAttribute(
      "aria-current",
    );
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

  it("探索で訪れた個人・手がかりページを静かに発見履歴へ記録し、Esc と外部クリックで閉じる", async () => {
    const user = userEvent.setup();
    nav.pathname = PHOTO_CONTEST_RESULT_PATH;
    const { rerender } = renderChrome();

    nav.pathname = "/pochiblo/denden0102";
    rerender(
      <StoryProvider>
        <BrowserChrome />
      </StoryProvider>,
    );

    const historyBtn = screen.getByRole("button", { name: "発見履歴" });
    expect(historyBtn).toHaveAttribute("aria-expanded", "false");

    await user.click(historyBtn);
    expect(historyBtn).toHaveAttribute("aria-expanded", "true");

    const panel = screen.getByRole("region", { name: "発見したページの履歴" });
    expect(within(panel).getByRole("link", { name: /でんでんの狩猟日記/ })).toHaveAttribute(
      "href",
      "/pochiblo/denden0102",
    );
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

  it("通常ルートでは Discord リンク先が dmListPath になる", () => {
    nav.pathname = "/search";
    renderChrome();
    expect(screen.getByRole("link", { name: /Discord/ })).toHaveAttribute("href", dmListPath());
  });
});
