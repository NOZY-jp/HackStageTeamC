import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StoryProvider, useStory } from "@/components/common/story/story-provider";
import { AppShell } from "@/components/discord-like/app-shell";
import type { MemberView, Message, MessageAuthor } from "@/lib/discord-like/types";
import { STORAGE_KEY } from "@/lib/story";
import { MessageList } from "./message-list";

function FlagProbe() {
  const { state } = useStory();
  return <span data-testid="story-flags">{state.flags.join(",")}</span>;
}

const author: MessageAuthor = { id: "u1", displayName: "テスト", avatarColor: "#5865f2" };
const authors: Record<string, MessageAuthor> = { u1: author };

const messages: Message[] = Array.from({ length: 3 }, (_, index) => ({
  id: `m-${index}`,
  channelId: "c1",
  authorId: "u1",
  sentAt: `2026-11-0${index + 1}T10:00:00+09:00`,
  body: `本文${index}`,
}));

/** jsdom にはレイアウトが無いので、スクロール量だけ手で与える */
function setMetrics(
  element: HTMLElement,
  { scrollTop, scrollHeight, clientHeight }: Record<string, number>,
) {
  Object.defineProperty(element, "scrollHeight", { configurable: true, value: scrollHeight });
  Object.defineProperty(element, "clientHeight", { configurable: true, value: clientHeight });
  element.scrollTop = scrollTop;
}

describe("MessageList の「最新へ」", () => {
  it("押すと親に通知し（位置補正の基準を捨てる）、最下部へ移動する", () => {
    const onJumpToLatest = vi.fn();
    const { container } = render(
      <AppShell rail={<span />}>
        <MessageList
          messages={messages}
          authors={authors}
          title="一般"
          showHash
          onLoadOlder={() => {}}
          onJumpToLatest={onJumpToLatest}
        />
      </AppShell>,
    );

    const scroller = container.querySelector(".message-scroll") as HTMLDivElement;
    setMetrics(scroller, { scrollTop: 100, scrollHeight: 2000, clientHeight: 500 });
    fireEvent.scroll(scroller);

    const button = container.querySelector(".message-jump-latest") as HTMLButtonElement | null;
    expect(button).not.toBeNull();
    fireEvent.click(button as HTMLButtonElement);

    expect(onJumpToLatest).toHaveBeenCalledTimes(1);
    expect(scroller.scrollTop).toBe(2000);
    expect(container.querySelector(".message-jump-latest")).toBeNull();
  });
});

describe("MessageList の検索ジャンプ（中央寄せ）", () => {
  const scrollIntoView = vi.fn();
  let original: typeof Element.prototype.scrollIntoView | undefined;

  beforeEach(() => {
    scrollIntoView.mockReset();
    original = Element.prototype.scrollIntoView;
    // jsdom は scrollIntoView を実装していないので、呼び出しだけ記録する
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  afterEach(() => {
    if (original) {
      Element.prototype.scrollIntoView = original;
    } else {
      Reflect.deleteProperty(Element.prototype, "scrollIntoView");
    }
  });

  const list = (items: Message[], focusMessageId?: string) => (
    <AppShell rail={<span />}>
      <MessageList
        messages={items}
        authors={authors}
        title="一般"
        showHash
        onLoadOlder={() => {}}
        focusMessageId={focusMessageId}
      />
    </AppShell>
  );

  it("ジャンプ直後は対象を画面中央に出す", () => {
    render(list(messages, "m-1"));

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "center" });
    expect((scrollIntoView.mock.contexts[0] as HTMLElement).dataset.messageId).toBe("m-1");
  });

  it("古いメッセージの追加読み込みで件数が増えても、中央寄せをやり直さない", () => {
    const { rerender } = render(list(messages, "m-1"));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    const older: Message[] = [
      { ...messages[0], id: "m-older", sentAt: "2026-10-31T10:00:00+09:00" },
      ...messages,
    ];
    rerender(list(older, "m-1"));

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("送信で末尾に増えても、中央寄せをやり直さない", () => {
    const { rerender } = render(list(messages, "m-1"));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    const sent: Message[] = [
      ...messages,
      { ...messages[0], id: "m-sent", sentAt: "2026-11-05T10:00:00+09:00", body: "送信しました" },
    ];
    rerender(list(sent, "m-1"));

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("ジャンプ先がまだ読まれていなければ、現れた1回だけ中央寄せする", () => {
    const { rerender } = render(list(messages.slice(0, 2), "m-2"));
    expect(scrollIntoView).not.toHaveBeenCalled();

    rerender(list(messages, "m-2"));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    const older: Message[] = [
      { ...messages[0], id: "m-older", sentAt: "2026-10-31T10:00:00+09:00" },
      ...messages,
    ];
    rerender(list(older, "m-2"));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("別のメッセージへジャンプし直したときは、その1回だけ中央寄せする", () => {
    const { rerender } = render(list(messages, "m-1"));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    rerender(list(messages, "m-2"));
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
    expect((scrollIntoView.mock.contexts[1] as HTMLElement).dataset.messageId).toBe("m-2");
  });
});

describe("メンバー一覧の絞り込み（#163）", () => {
  const members: MemberView[] = [
    {
      id: "hal",
      displayName: "琥珀",
      handle: "kohakunchos0117",
      avatarColor: "#5865f2",
      status: "online",
    },
    {
      id: "master",
      displayName: "集会所マスター",
      handle: "shuukai_master",
      avatarColor: "#95a5a6",
      status: "online",
    },
    {
      id: "denden",
      displayName: "hunter_denden",
      handle: "hunter_denden3243",
      avatarColor: "#7289da",
      status: "offline",
      profileUrl: "/pochiblo/mylist/k7q2m9d4",
    },
  ];

  const renderPanel = (resetKey = "mhc-chat") => {
    const view = render(
      <AppShell rail={<span />}>
        <MessageList
          messages={messages}
          authors={authors}
          title="雑談"
          showHash
          onLoadOlder={() => {}}
          members={members}
          resetKey={resetKey}
        />
      </AppShell>,
    );
    fireEvent.click(view.container.querySelector('button[aria-label="メンバー"]') as HTMLElement);
    return view;
  };

  const memberNames = (container: HTMLElement) =>
    [...container.querySelectorAll(".members-name")].map((node) => node.textContent);

  it("表示名・ハンドルの部分一致でメンバーを絞れる（オフラインの人も探せる）", () => {
    const { container } = renderPanel();
    expect(memberNames(container)).toEqual(["琥珀", "集会所マスター", "hunter_denden"]);

    const input = container.querySelector("#members-filter-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "denden" } });
    expect(memberNames(container)).toEqual(["hunter_denden"]);

    fireEvent.change(input, { target: { value: "hunter_denden3243" } });
    expect(memberNames(container)).toEqual(["hunter_denden"]);

    // 大文字小文字を区別しない
    fireEvent.change(input, { target: { value: "HUNTER" } });
    expect(memberNames(container)).toEqual(["hunter_denden"]);

    fireEvent.change(input, { target: { value: "shuukai" } });
    expect(memberNames(container)).toEqual(["集会所マスター"]);
  });

  it("一致するメンバーがいなければ「見つかりません」を出す", () => {
    const { container } = renderPanel();
    const input = container.querySelector("#members-filter-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "そんな人はいない" } });
    expect(memberNames(container)).toEqual([]);
    expect(container.querySelector(".members-panel-empty")?.textContent).toBe(
      "メンバーが見つかりません",
    );
  });

  it("チャンネルが変わったら絞り込みを戻す", () => {
    const { container, rerender } = renderPanel("mhc-chat");
    const input = container.querySelector("#members-filter-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "denden" } });
    expect(memberNames(container)).toEqual(["hunter_denden"]);

    rerender(
      <AppShell rail={<span />}>
        <MessageList
          messages={messages}
          authors={authors}
          title="雑談"
          showHash
          onLoadOlder={() => {}}
          members={members}
          resetKey="mhc-questions"
        />
      </AppShell>,
    );
    expect((container.querySelector("#members-filter-input") as HTMLInputElement).value).toBe("");
    expect(memberNames(container)).toEqual(["琥珀", "集会所マスター", "hunter_denden"]);
  });

  it("プロフィールのリンクはリンク先のURLをそのまま見せ、同一タブで開く", () => {
    const { container } = renderPanel();
    fireEvent.click(
      [...container.querySelectorAll(".members-row")].find((row) =>
        row.textContent?.includes("hunter_denden"),
      ) as HTMLElement,
    );
    const link = container.querySelector(".members-profile-link") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/pochiblo/mylist/k7q2m9d4");
    expect(link.getAttribute("target")).toBeNull();
    expect(link.textContent).toBe("pochiblo/mylist/k7q2m9d4");
  });
});

describe("旧垢発見のストーリーフラグ連携（順序5）", () => {
  const originalScrollIntoView = Element.prototype.scrollIntoView;

  beforeEach(() => {
    localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    localStorage.clear();
    if (originalScrollIntoView) {
      Element.prototype.scrollIntoView = originalScrollIntoView;
    } else {
      Reflect.deleteProperty(Element.prototype, "scrollIntoView");
    }
  });

  const members: MemberView[] = [
    {
      id: "denden",
      displayName: "hunter_denden",
      handle: "hunter_denden3243",
      avatarColor: "#7289da",
      status: "offline",
      profileUrl: "/pochiblo/mylist/k7q2m9d4",
    },
  ];

  it("メンバー一覧で denden のプロフィールを開くと s05-old-discord-user が立つ", async () => {
    const { container } = render(
      <StoryProvider>
        <FlagProbe />
        <AppShell rail={<span />}>
          <MessageList
            messages={messages}
            authors={authors}
            title="マルチ募集"
            showHash
            onLoadOlder={() => {}}
            members={members}
          />
        </AppShell>
      </StoryProvider>,
    );

    fireEvent.click(container.querySelector('button[aria-label="メンバー"]') as HTMLElement);
    fireEvent.click(
      [...container.querySelectorAll(".members-row")].find((row) =>
        row.textContent?.includes("hunter_denden"),
      ) as HTMLElement,
    );

    await waitFor(() => {
      expect(screen.getByTestId("story-flags").textContent).toContain("s05-old-discord-user");
    });
  });

  it("focusMessageId が denden の投稿を指していると s05-old-discord-user が立つ", async () => {
    const dendenAuthors: Record<string, MessageAuthor> = {
      denden: {
        id: "denden",
        displayName: "hunter_denden",
        avatarColor: "#7289da",
        profileUrl: "/pochiblo/mylist/k7q2m9d4",
      },
    };
    const dendenMessages: Message[] = [
      {
        id: "mhc-lfg-0901",
        channelId: "mhc-lfg",
        authorId: "denden",
        sentAt: "2018-04-20T21:14:00+09:00",
        body: "ネルギガンテを周回するパーティー組みたいです！",
      },
    ];

    render(
      <StoryProvider>
        <FlagProbe />
        <AppShell rail={<span />}>
          <MessageList
            messages={dendenMessages}
            authors={dendenAuthors}
            title="マルチ募集"
            showHash
            onLoadOlder={() => {}}
            focusMessageId="mhc-lfg-0901"
          />
        </AppShell>
      </StoryProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("story-flags").textContent).toContain("s05-old-discord-user");
    });
  });

  it("True End 手がかり2: toldKaiOldAccount の前には kai を隠し、後に出して開くと te02-kai-joined-mhc が立つ", async () => {
    const kaiEntry = {
      member: {
        id: "kai",
        displayName: "χ",
        handle: "imperial_chi",
        avatarColor: "#6e4e3a",
        status: "online" as const,
      },
      showWhenFlag: "toldKaiOldAccount" as const,
      onOpenFlag: "te02-kai-joined-mhc" as const,
      note: "最近このサーバーに参加",
    };

    // 報告前: メンバー一覧に χ は居ない
    const before = render(
      <StoryProvider>
        <FlagProbe />
        <AppShell rail={<span />}>
          <MessageList
            messages={messages}
            authors={authors}
            title="雑談"
            showHash
            onLoadOlder={() => {}}
            members={members}
            storyMember={kaiEntry}
          />
        </AppShell>
      </StoryProvider>,
    );
    fireEvent.click(before.container.querySelector('button[aria-label="メンバー"]') as HTMLElement);
    await waitFor(() => {
      expect(before.container.querySelectorAll(".members-row")).toHaveLength(1);
    });
    expect(before.container.textContent).not.toContain("imperial_chi");
    before.unmount();

    // 報告後: メンバー一覧に χ が加わり、開くと注記と te02-kai-joined-mhc が立つ
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ flags: ["toldKaiOldAccount"], completed: [], choices: {} }),
    );
    const after = render(
      <StoryProvider>
        <FlagProbe />
        <AppShell rail={<span />}>
          <MessageList
            messages={messages}
            authors={authors}
            title="雑談"
            showHash
            onLoadOlder={() => {}}
            members={members}
            storyMember={kaiEntry}
          />
        </AppShell>
      </StoryProvider>,
    );
    fireEvent.click(after.container.querySelector('button[aria-label="メンバー"]') as HTMLElement);

    const kaiRow = await waitFor(() => {
      const row = [...after.container.querySelectorAll(".members-row")].find((el) =>
        el.textContent?.includes("imperial_chi"),
      );
      expect(row).toBeDefined();
      return row as HTMLElement;
    });
    fireEvent.click(kaiRow);

    await waitFor(() => {
      expect(screen.getByTestId("story-flags").textContent).toContain("te02-kai-joined-mhc");
    });
    expect(after.container.querySelector(".members-profile-note")?.textContent).toBe(
      "最近このサーバーに参加",
    );
  });
});
