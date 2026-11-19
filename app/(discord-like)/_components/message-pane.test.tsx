import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/discord-like/app-shell";
import { listMessages } from "@/lib/discord-like";
import { toMessageView } from "@/lib/discord-like/view";
import { LocalMessagesProvider } from "./local-messages-context";

// クライアントは Server Action 経由で取得する（テストでは同じデータ層で代替）
vi.mock("@/app/(discord-like)/_actions/message-page", async () => {
  const { listDMMessages, listMessages } = await import("@/lib/discord-like");
  const { toMessageView } = await import("@/lib/discord-like/view");
  return {
    fetchMessagePage: async ({
      mode,
      key,
      before,
    }: {
      mode: "channel" | "dm";
      key: string;
      before?: string;
    }) => {
      const page =
        mode === "dm"
          ? listDMMessages({ threadId: key, before })
          : listMessages({ channelId: key, before });
      return toMessageView(page);
    },
  };
});

import { MessagePane } from "./message-pane";

const CHANNEL_ID = "s1-general";
const PAGE_SIZE = 50;

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

type ObserverRecord = {
  callback: ObserverCallback;
  targets: Element[];
  active: boolean;
};

const observers: ObserverRecord[] = [];

class MockIntersectionObserver {
  private record: ObserverRecord;
  constructor(callback: ObserverCallback) {
    this.record = { callback, targets: [], active: true };
    observers.push(this.record);
  }
  observe(target: Element) {
    this.record.active = true;
    this.record.targets.push(target);
  }
  unobserve() {}
  disconnect() {
    this.record.active = false;
  }
  takeRecords() {
    return [];
  }
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

const resizeObservers: { callback: () => void; targets: Element[] }[] = [];
class MockResizeObserver {
  private record: { callback: () => void; targets: Element[] };
  constructor(callback: () => void) {
    this.record = { callback, targets: [] };
    resizeObservers.push(this.record);
  }
  observe(target: Element) {
    this.record.targets.push(target);
  }
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", MockResizeObserver);

/** 高さが変わったときの補正を手動で起こす */
const triggerResize = () => {
  for (const observer of resizeObservers) {
    observer.callback();
  }
};

const triggerIntersect = async () => {
  // 上端 sentinel を監視している observer だけを発火させる（他の監視は無関係）
  const sentinelObservers = observers.filter(
    (observer) =>
      observer.active &&
      observer.targets.some((target) => target.getAttribute("data-testid") === "history-sentinel"),
  );
  await act(async () => {
    for (const observer of sentinelObservers) {
      observer.callback([{ isIntersecting: true }]);
    }
  });
};

const visibleMessages = (container: HTMLElement) => container.querySelectorAll(".message").length;

function renderPane(channelKey = CHANNEL_ID) {
  const initialView = toMessageView(listMessages({ channelId: channelKey, limit: PAGE_SIZE }));
  return render(
    <AppShell rail={<span />}>
      <LocalMessagesProvider>
        <MessagePane
          channelKey={channelKey}
          mode="channel"
          initialView={initialView}
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

    for (let attempt = 0; attempt < 8; attempt += 1) {
      if (screen.queryByText("ここが最初のメッセージです")) break;
      const before = visibleMessages(container);
      await triggerIntersect();
      await waitFor(
        () => {
          expect(visibleMessages(container)).toBeGreaterThanOrEqual(before);
        },
        { timeout: 3000 },
      );
      await new Promise((resolve) => setTimeout(resolve, 250));
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

  it("読み込み中に別チャンネルへ切り替えると、前のチャンネルの結果を持ち込まない", async () => {
    const first = renderPane();
    const channelA = listMessages({ channelId: CHANNEL_ID, limit: 1000 }).messages.map((m) => m.id);

    await triggerIntersect();

    // 追加読み込みの待ち（120ms）が終わる前に B へ切り替える
    const otherChannel = toMessageView(listMessages({ channelId: "s1-random", limit: PAGE_SIZE }));
    first.rerender(
      <AppShell rail={<span />}>
        <LocalMessagesProvider>
          <MessagePane
            channelKey="s1-random"
            mode="channel"
            initialView={otherChannel}
            title="雑談"
            topic="テスト"
          />
        </LocalMessagesProvider>
      </AppShell>,
    );

    await new Promise((resolve) => setTimeout(resolve, 400));

    const ids = Array.from(first.container.querySelectorAll(".message")).map((node) =>
      node.getAttribute("data-message-id"),
    );
    const expected = new Set(otherChannel.messages.map((message) => message.id));
    expect(ids).toHaveLength(PAGE_SIZE);
    expect(ids.every((id) => id !== null && expected.has(id))).toBe(true);
    expect(ids.some((id) => id !== null && channelA.includes(id))).toBe(false);
  });

  it("送信すると位置補正の基準が解除され、その後の高さ変化で勝手にスクロールしない", async () => {
    const { container } = renderPane();
    await triggerIntersect();
    await new Promise((resolve) => setTimeout(resolve, 300));

    const scroller = container.querySelector(".message-scroll") as HTMLDivElement;
    scroller.scrollTop = 500;

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    setter?.call(textarea, "補正解除の確認");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 50));
    const send = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "送信",
    ) as HTMLButtonElement | undefined;
    send?.click();
    await new Promise((resolve) => setTimeout(resolve, 80));

    // 送信後に高さが変わっても、補正で scrollTop を持ち上げない
    scroller.scrollTop = 300;
    triggerResize();
    expect(scroller.scrollTop).toBe(300);
  });

  it("A→B→A と戻ると、読み込み済みの続きがそのまま残る（空にならない）", async () => {
    const first = renderPane();
    const total = listMessages({ channelId: CHANNEL_ID, limit: 1000 }).messages.length;

    // 先頭まで遡って全件読み込む
    for (let attempt = 0; attempt < 8; attempt += 1) {
      if (screen.queryByText("ここが最初のメッセージです")) break;
      await triggerIntersect();
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    expect(visibleMessages(first.container)).toBe(total);

    const otherView = toMessageView(listMessages({ channelId: "s1-random", limit: PAGE_SIZE }));
    first.rerender(
      <AppShell rail={<span />}>
        <LocalMessagesProvider>
          <MessagePane
            channelKey="s1-random"
            mode="channel"
            initialView={otherView}
            title="雑談"
            topic="テスト"
          />
        </LocalMessagesProvider>
      </AppShell>,
    );
    await waitFor(() => expect(visibleMessages(first.container)).toBe(PAGE_SIZE));

    const backView = toMessageView(listMessages({ channelId: CHANNEL_ID, limit: PAGE_SIZE }));
    first.rerender(
      <AppShell rail={<span />}>
        <LocalMessagesProvider>
          <MessagePane
            channelKey={CHANNEL_ID}
            mode="channel"
            initialView={backView}
            title="一般"
            topic="テスト"
          />
        </LocalMessagesProvider>
      </AppShell>,
    );

    await waitFor(() => expect(visibleMessages(first.container)).toBe(total));
  });

  it("読み込み中に切り替えて戻っても、スケルトンが固着せず次の読み込みができる", async () => {
    const first = renderPane();
    await triggerIntersect();

    const otherView = toMessageView(listMessages({ channelId: "s1-random", limit: PAGE_SIZE }));
    first.rerender(
      <AppShell rail={<span />}>
        <LocalMessagesProvider>
          <MessagePane
            channelKey="s1-random"
            mode="channel"
            initialView={otherView}
            title="雑談"
            topic="テスト"
          />
        </LocalMessagesProvider>
      </AppShell>,
    );
    await new Promise((resolve) => setTimeout(resolve, 400));

    const backView = toMessageView(listMessages({ channelId: CHANNEL_ID, limit: PAGE_SIZE }));
    first.rerender(
      <AppShell rail={<span />}>
        <LocalMessagesProvider>
          <MessagePane
            channelKey={CHANNEL_ID}
            mode="channel"
            initialView={backView}
            title="一般"
            topic="テスト"
          />
        </LocalMessagesProvider>
      </AppShell>,
    );

    await waitFor(() => {
      expect(first.container.querySelector(".message-skeleton")).toBeNull();
    });

    // 固着していなければ、もう一度読み込める
    const before = visibleMessages(first.container);
    await triggerIntersect();
    await waitFor(
      () => {
        expect(visibleMessages(first.container)).toBeGreaterThan(before);
      },
      { timeout: 3000 },
    );
  });

  it("チャンネルが変わると読み込み状態をリセットする", async () => {
    const first = renderPane();
    await triggerIntersect();
    await waitFor(() => expect(visibleMessages(first.container)).toBe(PAGE_SIZE * 2));

    const otherChannel = toMessageView(listMessages({ channelId: "s1-random", limit: PAGE_SIZE }));
    first.rerender(
      <AppShell rail={<span />}>
        <LocalMessagesProvider>
          <MessagePane
            channelKey="s1-random"
            mode="channel"
            initialView={otherChannel}
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
