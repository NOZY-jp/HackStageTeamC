import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/discord-like/app-shell";
import { listMessages } from "@/lib/discord-like";
import { LocalMessagesProvider } from "./local-messages-context";
import { MessagePane } from "./message-pane";

const CHANNEL_ID = "s1-general";
const PAGE_SIZE = 50;

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

const observers: { callback: ObserverCallback; disconnect: () => void }[] = [];

class MockIntersectionObserver {
  constructor(callback: ObserverCallback) {
    observers.push({ callback, disconnect: () => {} });
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

const triggerIntersect = async () => {
  const observer = observers[observers.length - 1];
  await act(async () => {
    observer.callback([{ isIntersecting: true }]);
  });
};

const visibleMessages = (container: HTMLElement) => container.querySelectorAll(".message").length;

function renderPane(channelKey = CHANNEL_ID) {
  const initialPage = listMessages({ channelId: channelKey, limit: PAGE_SIZE });
  return render(
    <AppShell rail={<span />}>
      <LocalMessagesProvider>
        <MessagePane
          channelKey={channelKey}
          mode="channel"
          initialPage={initialPage}
          title="一般"
          topic="テスト"
        />
      </LocalMessagesProvider>
    </AppShell>,
  );
}

describe("MessagePane の段階的読み込み", () => {
  it("初期表示は最新50件だけを描画する", () => {
    const { container } = renderPane();
    expect(visibleMessages(container)).toBe(PAGE_SIZE);
    expect(container.querySelector(".message-skeleton")).toBeNull();
    expect(screen.queryByText("ここが最初のメッセージです")).not.toBeInTheDocument();
  });

  it("上端に近づくとスケルトンを出して50件を先頭に足す", async () => {
    const { container } = renderPane();
    const before = listMessages({ channelId: CHANNEL_ID, limit: PAGE_SIZE }).messages;
    const firstIdBefore = before[0].id;

    await triggerIntersect();

    // 追加中はスケルトンと読み上げ用の status が出る
    expect(container.querySelector(".message-skeleton")).not.toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("古いメッセージを読み込み中");

    await waitFor(
      () => {
        expect(visibleMessages(container)).toBe(PAGE_SIZE * 2);
      },
      { timeout: 2000 },
    );
    expect(container.querySelector(".message-skeleton")).toBeNull();

    // 先頭に古いメッセージが入り、元の先頭は後ろに残っている
    const firstIdAfter = container.querySelector(".message")?.getAttribute("data-message-id");
    expect(firstIdAfter).not.toBe(firstIdBefore);
    expect(firstIdAfter).toBe(
      listMessages({ channelId: CHANNEL_ID, before: firstIdBefore, limit: PAGE_SIZE }).messages[0]
        .id,
    );
  });

  it("先頭まで遡ると終端表示を出し、それ以上は増えない", async () => {
    const { container } = renderPane();
    const total = listMessages({ channelId: CHANNEL_ID, limit: 1000 }).messages.length;

    for (let loaded = PAGE_SIZE; loaded < total; loaded += PAGE_SIZE) {
      await triggerIntersect();
      await waitFor(
        () => {
          expect(visibleMessages(container)).toBeGreaterThanOrEqual(
            Math.min(loaded + PAGE_SIZE, total),
          );
        },
        { timeout: 3000 },
      );
    }

    await waitFor(() => {
      expect(screen.getByText("ここが最初のメッセージです")).toBeInTheDocument();
    });
    expect(visibleMessages(container)).toBe(total);

    // 終端では sentinel を監視しない（追加読み込みが起きない）
    const countAtEnd = visibleMessages(container);
    const observerCount = observers.length;
    await triggerIntersect();
    expect(observers.length).toBe(observerCount);
    expect(visibleMessages(container)).toBe(countAtEnd);
  });

  it("チャンネルが変わると読み込み状態をリセットする", async () => {
    const first = renderPane();
    await triggerIntersect();
    await waitFor(() => expect(visibleMessages(first.container)).toBe(PAGE_SIZE * 2));

    const otherChannel = listMessages({ channelId: "s1-random", limit: PAGE_SIZE });
    first.rerender(
      <AppShell rail={<span />}>
        <LocalMessagesProvider>
          <MessagePane
            channelKey="s1-random"
            mode="channel"
            initialPage={otherChannel}
            title="雑談"
            topic="テスト"
          />
        </LocalMessagesProvider>
      </AppShell>,
    );

    await waitFor(() => {
      expect(visibleMessages(first.container)).toBe(PAGE_SIZE);
    });
    // 前のチャンネルの続きが混ざらない
    const ids = Array.from(first.container.querySelectorAll(".message")).map((node) =>
      node.getAttribute("data-message-id"),
    );
    const expected = new Set(otherChannel.messages.map((message) => message.id));
    expect(ids.every((id) => id !== null && expected.has(id))).toBe(true);
  });
});
